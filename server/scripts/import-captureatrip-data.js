#!/usr/bin/env node
/**
 * Capture A Trip Migration Script
 * - Fetches destinations & trips from https://www.captureatrip.com sitemaps / flight payload
 * - Downloads media and uploads to AWS S3 (bucket 24x7-website, ap-south-1)
 * - Upserts into MongoDB (MONGODB_URI env, default local)
 * - Idempotent: slug / sourceUrl deterministic, safe to rerun
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname } from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';
import http from 'node:http';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });
// Fallback: also try from project root if above fails
if(!process.env.MONGODB_URI){
  dotenv.config({ path: resolve(__dirname, '../../../.env') });
}

import Destination from '../src/models/Destination.js';
import Trip from '../src/models/Trip.js';
import TripBatch from '../src/models/TripBatch.js';
import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const SOURCE_BASE = 'https://www.captureatrip.com';
const DEST_SITEMAP = `${SOURCE_BASE}/destination/sitemap.xml`;
const TRIP_SITEMAP = `${SOURCE_BASE}/trip/sitemap.xml`;
const THROTTLE_MS = 400;
const CONCURRENCY = 1;

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

function fetchText(url, retries=3){
  return new Promise((resolveFetch, reject)=>{
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (CaptureATrip-Migrator)', 'Accept':'text/html,application/xml,text/plain,*/*' } }, res=>{
      let data='';
      res.on('data',c=>data+=c);
      res.on('end',()=>{
        if(res.statusCode>=200 && res.statusCode<300) resolveFetch({status:res.statusCode, body:data, headers:res.headers});
        else if(res.statusCode>=500 && retries>0) setTimeout(()=>fetchText(url, retries-1).then(resolveFetch).catch(reject), 800);
        else resolveFetch({status:res.statusCode, body:data, headers:res.headers});
      });
    });
    req.on('error', err=>{
      if(retries>0) setTimeout(()=>fetchText(url, retries-1).then(resolveFetch).catch(reject), 800);
      else reject(err);
    });
    req.setTimeout(15000, ()=>{ req.destroy(new Error('timeout')); });
  });
}

function fetchBuffer(url, retries=2){
  return new Promise((res, rej)=>{
    const lib = url.startsWith('https') ? https : http;
    const req=lib.get(url, { headers:{'User-Agent':'Mozilla/5.0'} }, r=>{
      if(r.statusCode!==200){
        if(retries>0) return setTimeout(()=>fetchBuffer(url, retries-1).then(res).catch(rej), 500);
        return rej(new Error(`HTTP ${r.statusCode} for ${url}`));
      }
      const chunks=[];
      r.on('data',c=>chunks.push(c));
      r.on('end',()=>res({buffer: Buffer.concat(chunks), contentType: r.headers['content-type']||'image/jpeg'}));
    });
    req.on('error', e=>{
      if(retries>0) setTimeout(()=>fetchBuffer(url, retries-1).then(res).catch(rej), 500);
      else rej(e);
    });
    req.setTimeout(15000, function(){ this.destroy(new Error('timeout')); if(retries>0) setTimeout(()=>fetchBuffer(url, retries-1).then(res).catch(rej), 500); });
  });
}

function getS3(){
  const region=process.env.AWS_REGION;
  const bucket=process.env.AWS_S3_BUCKET;
  const accessKeyId=process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey=process.env.AWS_SECRET_ACCESS_KEY;
  const configured=Boolean(region && bucket && accessKeyId && secretAccessKey);
  if(!configured) return { configured:false, client:null, bucket, region };
  const client=new S3Client({ region, credentials:{ accessKeyId, secretAccessKey } });
  function s3ObjectUrl(b,r,k){ return `https://${b}.s3.${r}.amazonaws.com/${encodeURIComponent(k).replace(/%2F/g,'/')}`; }
  return { configured:true, client, bucket, region, getUrl:(key)=> key ? s3ObjectUrl(bucket, region, key) : '' };
}
async function uploadBufferToS3(buffer, { folder, originalName, mimeType }){
  const { configured, client, bucket, getUrl } = getS3();
  if(!configured || !client) throw new Error('S3 not configured');
  const APP_PREFIX='travel-crm/';
  const ext = extname(originalName||'') || mimeToExt(mimeType);
  const unique = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const base = (folder||'travel-crm/website').replace(/^\/+|\/+$/g,'');
  const key = `${base}/${unique}`;
  if(!key.startsWith(APP_PREFIX) || /(^|\/)\.\.(\/|$)/.test(key)) throw new Error(`Forbidden key ${key}`);
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType || 'image/jpeg',
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  const url = getUrl(key);
  return { publicId:key, secureUrl:url, url, format: ext.replace('.','')||'jpg', bytes: buffer.length, resourceType:'image' };
}
function mimeToExt(mime=''){
  const map={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif','video/mp4':'.mp4','application/pdf':'.pdf'};
  return map[mime]||'';
}
function guessMimeFromUrl(url){
  const e=extname(new URL(url).pathname).toLowerCase();
  if(e==='.webp') return 'image/webp';
  if(e==='.jpg'||e==='.jpeg') return 'image/jpeg';
  if(e==='.png') return 'image/png';
  if(e==='.mp4') return 'video/mp4';
  if(e==='.pdf') return 'application/pdf';
  return 'image/jpeg';
}

function parseSitemap(xml){
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].trim());
}

function extractFlightDecoded(html){
  const pushes=[...html.matchAll(/self\.__next_f\.push\(\[1,"(.*?)"\]\)/gs)].map(m=>m[1]);
  const combined=pushes.join('');
  // The push strings contain escaped chars; we keep them escaped for regex but also decode unicode for easier parsing
  // We'll return combined as is plus a decoded version where \u00xx etc are kept but \" becomes "
  let decoded=combined.replace(/\\"/g,'"');
  // Keep \\ as \
  decoded=decoded.replace(/\\\\/g,'\\');
  // Also decode \u003c etc partially for HTML detection: keep as \u003c for pattern but also provide a unicode-decoded variant
  return { combined, decoded, pushes };
}

function buildReferenceMap(decoded){
  // Find definitions like 20:T8005, or 1f:T828,
  const map=new Map();
  // The decoded string contains segments like '20:T8005,\u003cp\u003e...'
  // We'll capture key and then the following content up to next '",'
  // Instead of using length, we capture via regex that grabs the text until '",'
  // But the content itself may contain '",'? Unlikely since HTML uses \u003e etc.
  const regex=/([0-9a-fA-F]+):T\d+,/g;
  let m;
  while((m=regex.exec(decoded))!==null){
    const key=m[1];
    const start= m.index + m[0].length;
    // Find the end: look for '",[' or '",\"' or '"}' etc. The next boundary is '",'
    // We search for '",' or '"]' or '"},'
    // For our HTML blocks, they end with '",'
    let end=decoded.indexOf('",', start);
    if(end===-1) end=decoded.indexOf('"', start+200);
    if(end===-1) end=start+10000;
    const raw=decoded.slice(start, end);
    // raw is escaped HTML starting with \u003c
    // Unescape unicode: \u003c -> <
    const html=raw.replace(/\\u003c/g,'<').replace(/\\u003e/g,'>').replace(/\\u0026/g,'&').replace(/\\"/g,'"').replace(/\\n/g,'\n');
    map.set(key, html);
    map.set(`$${key}`, html);
  }
  return map;
}

function resolveRefs(decoded, map){
  // Replace "$20" etc with actual content if map has it
  return decoded.replace(/"\$([0-9a-fA-F]+)"/g, (_,k)=>{
    if(map.has(k)) return JSON.stringify(map.get(k));
    if(map.has(`$${k}`)) return JSON.stringify(map.get(`$${k}`));
    return `"$$${k}"`;
  });
}

function extractBetween(decoded, startMarker, endMarker){
  const s=decoded.indexOf(startMarker);
  if(s===-1) return null;
  const e=decoded.indexOf(endMarker, s+startMarker.length);
  if(e===-1) return null;
  return decoded.slice(s+startMarker.length, e);
}

function decodeUnicodeEscapes(str){
  if(!str) return '';
  return str.replace(/\\u003c/g,'<').replace(/\\u003e/g,'>').replace(/\\u0026/g,'&').replace(/\\u0027/g,"'").replace(/\\"/g,'"').replace(/\\n/g,'\n').replace(/\\t/g,'\t');
}
function stripHtml(html){
  if(!html) return '';
  // Very naive strip: remove tags, decode entities
  let t=html.replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
  // Decode unicode escapes already done
  return t;
}
function htmlToPlainWithBreaks(html){
  if(!html) return '';
  let t=decodeUnicodeEscapes(html);
  // Replace block tags with newlines
  t=t.replace(/<\s*br[^>]*>/gi,'\n').replace(/<\s*\/p\s*>/gi,'\n\n').replace(/<\s*\/li\s*>/gi,'\n').replace(/<\s*\/h[1-6]\s*>/gi,'\n\n').replace(/<\s*\/div\s*>/gi,'\n');
  t=t.replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').trim();
  return t.replace(/\n{3,}/g,'\n\n').trim();
}

function extractDestinationFields(html, slug){
  const { decoded } = extractFlightDecoded(html);
  const refMap=buildReferenceMap(decoded);
  // Locate the destination's data block specifically (avoid initialDestinations false positives)
  let destBlock='';
  const escapedSlug=slug.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  // Find all occurrences of this slug; pick the one whose context contains "about" and "destinationType" and whose preceding location is near
  const slugIndices=[...decoded.matchAll(new RegExp(`"slug":"${escapedSlug}"`, 'g'))].map(m=>m.index);
  let bestIdx=-1;
  let bestScore=-1;
  for(const idx of slugIndices){
    const window=decoded.slice(Math.max(0, idx-4000), idx+8000);
    let score=0;
    if(window.includes('"about"')) score+=5;
    if(window.includes('"destinationType"')) score+=5;
    if(window.includes('"metatitle"')) score+=3;
    if(window.includes('"title"')) score+=2;
    // Prefer windows where slug is followed by location within 500 chars (data block order slug->location)
    const after=decoded.slice(idx, idx+800);
    if(after.includes('"location"')) score+=4;
    if(score>bestScore){ bestScore=score; bestIdx=idx; }
  }
  if(bestIdx!==-1){
    destBlock=decoded.slice(Math.max(0, bestIdx-4000), bestIdx+12000);
  } else {
    const idx=decoded.indexOf(`"slug":"${slug}"`);
    if(idx!==-1) destBlock=decoded.slice(Math.max(0, idx-4000), idx+12000);
    else destBlock=decoded;
  }
  const getFieldFromBlock=(field, block=destBlock)=>{
    const re=new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`);
    const m=block.match(re) || decoded.match(re);
    return m? decodeUnicodeEscapes(m[1]) : null;
  };
  const getField=(field)=> getFieldFromBlock(field, destBlock);
  const getFieldRaw=(field)=>{
    const re=new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`);
    const m=destBlock.match(re) || decoded.match(re);
    return m? m[1] : null;
  };
  const location=getField('location');
  const title=getField('title');
  const destinationType=getField('destinationType');
  const metatitle=getField('metatitle');
  const metadescription=getField('metadescription');
  const metakeywords=getField('metakeywords');
  const locationId=getFieldRaw('locationId') || getField('locationId');
  // Extract destination-specific hero image from destBlock (schemaMarkup image is most reliable)
  let heroFromSchema=null;
  const schemaMatch=destBlock.match(/"image"\s*:\s*"(https:\/\/[^"]+\.(?:webp|jpg|jpeg|png))"/);
  if(schemaMatch) heroFromSchema=schemaMatch[1];
  // Also try to resolve mainBannerWeb if it contains a direct cdnURL inside destBlock (video case)
  let bannerWeb=null, bannerMob=null;
  const bannerWebMatch=destBlock.match(/"mainBannerWeb"\s*:\s*\{[^}]*"cdnURL"\s*:\s*"([^"]+)"/);
  if(bannerWebMatch) bannerWeb=bannerWebMatch[1];
  else {
    // Resolve via reference $10:1:... - search decoded for that reference's target
    const refMatch=destBlock.match(/"mainBannerWeb"\s*:\s*"\$([^"]+)"/);
    if(refMatch){
      const refKey=refMatch[1].split(':').pop() || refMatch[1];
      // Try to find the referenced cdnURL elsewhere in decoded that contains location name
      const locLower=location?location.toLowerCase():slug.split('-')[0];
      const candidates=[...decoded.matchAll(/"cdnURL"\s*:\s*"([^"]+)"/g)].map(m=>m[1]).filter(u=>u.toLowerCase().includes(locLower));
      if(candidates.length>0) bannerWeb=candidates[0];
    }
  }
  const bannerMobMatch=destBlock.match(/"mainBannerMobile"\s*:\s*\{[^}]*"cdnURL"\s*:\s*"([^"]+)"/);
  if(bannerMobMatch) bannerMob=bannerMobMatch[1];
  // Build destination-specific image list: heroFromSchema is primary, fallback to bannerWeb
  const coverMatchesScope=[...destBlock.matchAll(/"cdnURL"\s*:\s*"([^"]+)"/g)].map(m=>m[1]).filter(u=>u.includes('cloudfront')||u.includes('s3'));
  // Also include html og images that are destination-specific (contain slug or location)
  const locLowerForImg=(location||slug).toLowerCase().replace(/\s+/g,'-');
  const htmlImgsDest=[...html.matchAll(/https:\/\/[^"'\s]+?\.(webp|jpg|jpeg|png)/gi)].map(m=>m[0]).filter(u=>u.toLowerCase().includes(locLowerForImg) || u.includes('captureatrip-new-website'));
  // About HTML: find the largest HTML block via refMap or via decoded length
  let aboutHtml='';
  if(decoded.includes('"about":"$')){
    const aboutKeyMatch=decoded.match(/"about"\s*:\s*"\$([0-9a-fA-F]+)"/);
    if(aboutKeyMatch){
      const k=aboutKeyMatch[1];
      if(refMap.has(k)) aboutHtml=refMap.get(k);
      else if(refMap.has(`$${k}`)) aboutHtml=refMap.get(`$${k}`);
    }
  }
  if(!aboutHtml){
    // Fallback: find the longest HTML snippet containing <p> in decoded
    const htmlSnippets=[...decoded.matchAll(/\\u003cp\\u003e.*?\\u003c\/p\\u003e/gs)].map(m=>decodeUnicodeEscapes(m[0]));
    if(htmlSnippets.length>0){
      aboutHtml=htmlSnippets.reduce((a,b)=>a.length>b.length?a:b,'');
      // But bali about is multiple paragraphs, we already have full about from 20:T8005
      // refMap fallback already captured full about (8005 chars) which includes multiple <p> and <h2>
      // So if we didn't get it, try to use refMap's largest value
      if(!aboutHtml || aboutHtml.length<1000){
        const largest=[...refMap.values()].reduce((a,b)=>a.length>b.length?a:b,'');
        if(largest.length>aboutHtml.length) aboutHtml=largest;
      }
    }
  }
  // Build destination-specific image list in priority order - hero must be IMAGE, not video
  const isImageUrl=(u)=> /\.(webp|jpg|jpeg|png)(\?|$)/i.test(u);
  const decodeNextImage=(htmlStr)=>{
    const out=new Set();
    for(const m of htmlStr.matchAll(/\/_next\/image\?url=([^&"\s]+)/g)){
      try{ const dec=decodeURIComponent(m[1]); if(isImageUrl(dec)) out.add(dec); }catch{}
    }
    return out;
  };
  const nextImgs=decodeNextImage(html);
  // Also consider og:image if image
  const ogMatch=html.match(/<meta property="og:image" content="([^"]+)"/i);
  const ogImage=ogMatch && isImageUrl(ogMatch[1]) && !ogMatch[1].includes('og/og.webp') ? ogMatch[1] : null;
  const imgUrls=new Set();
  if(heroFromSchema && isImageUrl(heroFromSchema)) imgUrls.add(heroFromSchema);
  if(bannerWeb && isImageUrl(bannerWeb)) imgUrls.add(bannerWeb);
  if(bannerMob && isImageUrl(bannerMob)) imgUrls.add(bannerMob);
  if(ogImage) imgUrls.add(ogImage);
  for(const u of nextImgs) if(u.includes('captureatrip')||u.includes('cloudfront')||u.includes('s3')||u.toLowerCase().includes((location||'').toLowerCase().split(' ')[0])) imgUrls.add(u);
  // Scoped cdnURLs from destBlock - only images, and prefer destination-specific
  for(const u of coverMatchesScope){
    if(!isImageUrl(u)) continue;
    const lower=u.toLowerCase();
    const locSlug=(location||slug).toLowerCase();
    const slugPart=slug.split('-')[0];
    if(lower.includes(locSlug) || lower.includes(slugPart) || u.includes('captureatrip-new-website') || u.includes('testimony')) imgUrls.add(u);
  }
  for(const u of htmlImgsDest) if(isImageUrl(u)) imgUrls.add(u);
  // Fallback: if still empty, add any decoded image that contains location and is image
  if(imgUrls.size===0){
    const fallbackImgs=[...decoded.matchAll(/https:\\\/\\\/[^"]+?\.(webp|jpg|jpeg|png)/gi)].map(m=>m[0].replace(/\\\//g,'/')).filter(u=>isImageUrl(u) && u.toLowerCase().includes((location||'').toLowerCase().split(' ')[0]) );
    for(const u of fallbackImgs) imgUrls.add(u);
  }
  // If hero still would be video, force image hero: ensure first entry is image
  if(imgUrls.size===0 && heroFromSchema && isImageUrl(heroFromSchema)) imgUrls.add(heroFromSchema);
  // If still empty, try ogImage already computed
  if(imgUrls.size===0 && ogImage) imgUrls.add(ogImage);

  // Title fallback from <title>
  let htmlTitle=null;
  const titleMatch=html.match(/<title>([^<]+)<\/title>/i);
  if(titleMatch) htmlTitle=titleMatch[1].trim();

  // Description fallback from meta
  let metaDesc=null;
  const metaMatch=html.match(/<meta name="description" content="([^"]+)"/i);
  if(metaMatch) metaDesc=metaMatch[1];

  // Starting price: try to find trendingDestinations startingPrice for this slug, or fallback to banner?
  let startingPrice=null;
  // The trendingDestinations block at bottom contains startingPrice for each dest
  // We can extract all slugs and startingPrice pairs
  const destPricePairs=[...decoded.matchAll(/"slug"\s*:\s*"([^"]+)"[^}]*"startingPrice"\s*:\s*(\d+)/g)];
  for(const [,s,price] of destPricePairs){
    if(s===slug) { startingPrice=Number(price); break; }
  }
  // Also try to find any "startingPrice": 49999 in the dest's data block (maybe not)
  if(startingPrice===null){
    const spMatch=decoded.match(/"startingPrice"\s*:\s*(\d+)/);
    if(spMatch) startingPrice=Number(spMatch[1]);
  }

  return {
    location: location || slug.split('-')[0],
    title: title || htmlTitle || slug,
    destinationType: destinationType || 'Domestic',
    metatitle: metatitle || htmlTitle || '',
    metadescription: metadescription || metaDesc || '',
    metakeywords: metakeywords || '',
    bannerWeb,
    bannerMob,
    aboutHtml: aboutHtml || '',
    aboutPlain: htmlToPlainWithBreaks(aboutHtml) || '',
    coverImages: [...imgUrls],
    startingPrice,
    rawDecoded: decoded,
  };
}

function extractTripFields(html, slug){
  const { decoded } = extractFlightDecoded(html);
  const refMap=buildReferenceMap(decoded);
  const resolved=resolveRefs(decoded, refMap);
  // Isolate trip's data block: find "data":{ that contains trip fields (inclusions + relatedBatches)
  let tripBlock=decoded;
  let found=false;
  for(const m of decoded.matchAll(/"data":\{/g)){
    const idx=m.index;
    const window=decoded.slice(idx, idx+40000);
    if(window.includes('"inclusions"') && window.includes('"relatedBatches"')){
      tripBlock=window;
      found=true;
      break;
    }
  }
  if(!found){
    const rbIdx=decoded.indexOf('"relatedBatches"');
    if(rbIdx!==-1){
      tripBlock=decoded.slice(Math.max(0, rbIdx-15000), rbIdx+9000);
    } else {
      const incIdx=decoded.indexOf('"inclusions"');
      if(incIdx!==-1) tripBlock=decoded.slice(Math.max(0, incIdx-15000), incIdx+9000);
    }
  }
  const get=(field)=>{
    // Prefer tripBlock first, then full decoded
    const re=new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`);
    let m=tripBlock.match(re);
    if(m) return decodeUnicodeEscapes(m[1]);
    m=decoded.match(re) || resolved.match(re);
    return m? decodeUnicodeEscapes(m[1]): null;
  };
  const getNum=(field)=>{
    const re=new RegExp(`"${field}"\\s*:\\s*(\\d+)`);
    let m=tripBlock.match(re);
    if(m) return Number(m[1]);
    m=decoded.match(re) || resolved.match(re);
    return m? Number(m[1]): null;
  };
  // Prefer HTML title as most reliable for trip title (contains clean trip name)
  let htmlTitleForTrip=null;
  const tmHtml=html.match(/<title>([^<]+)<\/title>/i);
  if(tmHtml) htmlTitleForTrip=tmHtml[1].split('|')[0].trim();
  const title=get('title') || htmlTitleForTrip;
  const location=get('location');
  const metatitle=get('metatitle');
  const metadescription=get('metadescription');
  const metakeywords=get('metakeywords');
  const startingPrice=getNum('startingPrice');
  const discount=getNum('discount');
  // Extract trip-specific mainBanner (must be inside tripBlock)
  const bannerWebMatch=tripBlock.match(/"mainBannerWeb"\s*:\s*\{[^}]*"cdnURL"\s*:\s*"([^"]+)"/) || decoded.match(/"mainBannerWeb"\s*:\s*\{[^}]*"cdnURL"\s*:\s*"([^"]+)"/);
  const bannerMobMatch=tripBlock.match(/"mainBannerMobile"\s*:\s*\{[^}]*"cdnURL"\s*:\s*"([^"]+)"/) || decoded.match(/"mainBannerMobile"\s*:\s*\{[^}]*"cdnURL"\s*:\s*"([^"]+)"/);
  const bannerWeb=bannerWebMatch? bannerWebMatch[1]: null;
  const bannerMob=bannerMobMatch? bannerMobMatch[1]: null;
  // Inclusions / exclusions via refMap
  let inclusionsHtml='', exclusionsHtml='';
  const incMatch=decoded.match(/"inclusions"\s*:\s*"\$([0-9a-fA-F]+)"/);
  if(incMatch && refMap.has(incMatch[1])) inclusionsHtml=refMap.get(incMatch[1]);
  const excMatch=decoded.match(/"exclusions"\s*:\s*"(\\u003c[^"]+)"/);
  if(excMatch) exclusionsHtml=decodeUnicodeEscapes(excMatch[1]);
  else {
    // fallback: find exclusions raw not ref
    const rawExc=decoded.match(/"exclusions"\s*:\s*"(\\u003c.*?)"/);
    if(rawExc) exclusionsHtml=decodeUnicodeEscapes(rawExc[1]);
  }
  if(!inclusionsHtml){
    const rawInc=decoded.match(/"inclusions"\s*:\s*"(\\u003c.*?)"/);
    if(rawInc) inclusionsHtml=decodeUnicodeEscapes(rawInc[1]);
  }
  // Itinerary: array of objects with title, dayCount, description
  const itinerary=[];
  // The decoded contains itinerary array as JSON-like; try to extract via regex for each day
  const dayMatches=[...decoded.matchAll(/\{"title"\s*:\s*"([^"]+)"\s*,\s*"dayCount"\s*:\s*"([^"]+)"\s*,\s*"description"\s*:\s*"(\\u003c[^"]+?)"/g)];
  for(const [,t,dc,descEsc] of dayMatches){
    itinerary.push({ title: decodeUnicodeEscapes(t), dayCount: dc.trim(), description: decodeUnicodeEscapes(descEsc) });
  }
  // Fallback: try to find dayCount variants without quotes on description ref
  if(itinerary.length===0){
    const alt=[...decoded.matchAll(/"title"\s*:\s*"([^"]+)"[^}]*"dayCount"\s*:\s*"([^"]+)"[^}]*"description"\s*:\s*"\$([0-9a-fA-F]+)"/g)];
    for(const [,t,dc,k] of alt){
      const desc=refMap.get(k)||'';
      itinerary.push({ title: decodeUnicodeEscapes(t), dayCount: dc.trim(), description: desc });
    }
  }
  // Also check for itinerary length -> days count
  const daysCount=itinerary.length || getNum('tripDays') || null;
  // Batches: flexible extraction - find all batchDate and then look around for price/discount/endDate
  const batches=[];
  const batchDateMatches=[...tripBlock.matchAll(/"batchDate"\s*:\s*"([^"]+)"/g)].map(m=>({date:m[1], idx:m.index}));
  if(batchDateMatches.length===0){
    // fallback to full decoded
    batchDateMatches.push(...[...decoded.matchAll(/"batchDate"\s*:\s*"([^"]+)"/g)].map(m=>({date:m[1], idx:m.index})));
  }
  for(const {date, idx} of batchDateMatches){
    const window=tripBlock.slice(Math.max(0, idx-1500), idx+1500) + decoded.slice(Math.max(0, idx-1500), idx+1500);
    const priceMatch=window.match(/"price"\s*:\s*(\d+)/);
    const discountMatch=window.match(/"discount"\s*:\s*(\d+)/);
    const endMatch=window.match(/"endDate"\s*:\s*"([^"]+)"/);
    const remainMatch=window.match(/"remainSlots"\s*:\s*(\d+)/);
    const maxMatch=window.match(/"maxSlots"\s*:\s*(\d+)/);
    const price=priceMatch?Number(priceMatch[1]): (startingPrice||0);
    const discount=discountMatch?Number(discountMatch[1]):0;
    const endDate=endMatch?endMatch[1]:null;
    const remainSlots=remainMatch?Number(remainMatch[1]):null;
    const maxSlots=maxMatch?Number(maxMatch[1]):30;
    // Deduplicate by date
    if(!batches.find(b=>b.batchDate===date)){
      batches.push({ price, discount, batchDate:date, endDate, remainSlots, maxSlots });
    }
  }

  // Trip-specific images: prefer cdnURLs inside tripBlock, filter to images only
  const isTripImage=(u)=> /\.(webp|jpg|jpeg|png)(\?|$)/i.test(u);
  const cdnUrlsTrip=[...tripBlock.matchAll(/"cdnURL"\s*:\s*"([^"]+)"/g)].map(m=>m[1]);
  const imgs=new Set(cdnUrlsTrip.filter(u=> (u.includes('cloudfront')||u.includes('s3')) && isTripImage(u)));
  if(bannerWeb && isTripImage(bannerWeb)) imgs.add(bannerWeb);
  if(bannerMob && isTripImage(bannerMob)) imgs.add(bannerMob);
  // Decode Next.js optimized image URLs
  for(const m of html.matchAll(/\/_next\/image\?url=([^&"\s]+)/g)){
    try{ const dec=decodeURIComponent(m[1]); if(isTripImage(dec) && (dec.includes('trip/cover') || dec.includes('captureatrip') || dec.includes('cloudfront'))) imgs.add(dec); }catch{}
  }
  // Fallback: if tripBlock had no image (rare), add any decoded cdnURL that contains trip slug keyword and is image
  if(imgs.size===0){
    const slugKeyword=slug.split('-')[0];
    const fallback=[...decoded.matchAll(/"cdnURL"\s*:\s*"([^"]+)"/g)].map(m=>m[1]).filter(u=>u.toLowerCase().includes(slugKeyword) && isTripImage(u));
    for(const u of fallback) imgs.add(u);
  }
  // htmlImgs: filter to trip-specific and image
  const htmlImgsTrip=[...html.matchAll(/https:\/\/[^"'\s]+?\.(webp|jpg|jpeg|png)/gi)].map(m=>m[0]).filter(u=> (u.includes('trip/cover') || u.includes('captureatrip-new-website')) && isTripImage(u));
  for(const u of htmlImgsTrip) imgs.add(u);

  let htmlTitle=null;
  const tm=html.match(/<title>([^<]+)<\/title>/i);
  if(tm) htmlTitle=tm[1].trim();
  let metaDesc=null;
  const mm=html.match(/<meta name="description" content="([^"]+)"/i);
  if(mm) metaDesc=mm[1];

  // Duration: try to extract from title like "7 Days" or from batches tripDays
  let durationDays=daysCount||7;
  let durationNights=Math.max(0, durationDays-1);
  // Try to parse from slug like 6n-7d
  const durMatch=slug.match(/(\d+)n-(\d+)d|\b(\d+)-days?\b/i);
  if(durMatch){
    if(durMatch[1] && durMatch[2]){ durationNights=Number(durMatch[1]); durationDays=Number(durMatch[2]); }
    else if(durMatch[3]) durationDays=Number(durMatch[3]);
  } else {
    const tDur=title?.match(/(\d+)\s*Days?/i);
    if(tDur) durationDays=Number(tDur[1]);
  }

  return {
    title: title || htmlTitle || slug,
    location: location || 'India',
    metatitle: metatitle || htmlTitle || '',
    metadescription: metadescription || metaDesc || '',
    metakeywords: metakeywords || '',
    startingPrice,
    discount,
    bannerWeb,
    bannerMob,
    inclusionsHtml,
    exclusionsHtml,
    itinerary,
    batches,
    coverImages:[...imgs],
    durationDays,
    durationNights,
    rawDecoded: decoded,
  };
}

function countryFromDestination(location, destinationType){
  const domestic=destinationType && destinationType.toLowerCase()==='domestic';
  if(domestic) return 'India';
  // For international, try to map known locations to countries; fallback to location
  const map={
    'Bali':'Indonesia',
    'Thailand':'Thailand',
    'Dubai':'United Arab Emirates',
    'Singapore':'Singapore',
    'Malaysia':'Malaysia',
    'Baku':'Azerbaijan',
    'Georgia':'Georgia',
    'Spain':'Spain',
    'Spain with Ibiza':'Spain',
    'Bhutan':'Bhutan',
    'Nepal':'Nepal',
    'Sri Lanka':'Sri Lanka',
    'Maldives':'Maldives',
    'Vietnam':'Vietnam',
    'Japan':'Japan',
    'Almaty':'Kazakhstan',
    'Oman':'Oman',
    'Egypt':'Egypt',
    'Greece':'Greece',
    'Philippines':'Philippines',
    'Cambodia':'Cambodia',
    'Russia':'Russia',
    'Europe':'Europe',
    'Northern Lights':'Norway',
  };
  return map[location] || location;
}
function regionFromDestination(location, destinationType){
  const domestic=destinationType && destinationType.toLowerCase()==='domestic';
  if(domestic) return location;
  return '';
}
function categoryFromType(destinationType, slug){
  if(!destinationType) return 'other';
  const t=destinationType.toLowerCase();
  if(t==='international') return 'international';
  if(t==='domestic') return 'domestic';
  // Weekend detection via slug
  if(slug.includes('weekend') || slug.includes('getaway')) return 'weekend';
  return t==='international'?'international': t==='domestic'?'domestic':'other';
}
function slugifySimple(s){
  return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-');
}

// Trip type heuristic
function tripTypeFromTitle(title, destinationType){
  const t=(title||'').toLowerCase();
  if(t.includes('honeymoon')) return 'honeymoon';
  if(t.includes('girls')) return 'group'; // girls trips are group
  if(t.includes('bike')) return 'adventure';
  if(t.includes('trek')) return 'adventure';
  if(t.includes('weekend')) return 'weekend';
  if(destinationType && destinationType.toLowerCase()==='international') return 'international';
  if(destinationType && destinationType.toLowerCase()==='domestic') return 'domestic';
  return 'group';
}

async function main(){
  const args=process.argv.slice(2);
  const dryRun=args.includes('--dry-run');
  const limitDest=parseInt(args.find(a=>a.startsWith('--limit-dest='))?.split('=')[1]||'0',10);
  const limitTrip=parseInt(args.find(a=>a.startsWith('--limit-trip='))?.split('=')[1]||'0',10);
  const skipMedia=args.includes('--skip-media');
  const quick=args.includes('--quick');

  console.log('=== Capture A Trip Migration ===');
  console.log(`MONGODB_URI env: ${process.env.MONGODB_URI ? 'set' : 'NOT SET (will use default)'}`);
  const s3Init=getS3();
  console.log(`S3 configured: ${s3Init.configured} bucket=${s3Init.bucket} region=${s3Init.region}`);
  if(!s3Init.configured) console.warn('WARNING: S3 not configured, media upload will be skipped');

  // Connect DB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/24x7-website', { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected: ${mongoose.connection.name} @ ${mongoose.connection.host}`);

  const stats={
    destinationsDiscovered:0, destinationsImported:0, destinationsSkipped:0, destinationsUpdated:0,
    tripsDiscovered:0, tripsImported:0, tripsSkipped:0, tripsUpdated:0,
    imagesDiscovered:0, imagesUploaded:0, imagesFailed:0,
    batchesCreated:0, batchesUpdated:0,
    failedUrls:[],
  };

  // Show what will be removed before deleting
  const beforeDest=await Destination.countDocuments();
  const beforeTrip=await Trip.countDocuments();
  const beforeBatch=await TripBatch.countDocuments();
  console.log(`Before migration: destinations=${beforeDest} trips=${beforeTrip} batches=${beforeBatch}`);
  const noClear=args.includes('--no-clear');
  if((beforeDest>0 || beforeTrip>0) && !noClear){
    console.log('Clearing existing destination/trip demo data (preserving users, settings, etc.)...');
    if(!dryRun){
      // Only delete destinations/trips/batches - preserve users etc.
      const delDest=await Destination.deleteMany({});
      const delTrip=await Trip.deleteMany({});
      const delBatch=await TripBatch.deleteMany({});
      console.log(`Removed: destinations=${delDest.deletedCount} trips=${delTrip.deletedCount} batches=${delBatch.deletedCount}`);
    } else {
      console.log('[dry-run] would delete destinations/trips/batches');
    }
  } else if(noClear){
    console.log('--no-clear: preserving existing destinations/trips, will upsert');
  }

  // Fetch sitemaps
  console.log('Fetching sitemaps...');
  const destSitemapRes=await fetchText(DEST_SITEMAP);
  if(destSitemapRes.status!==200) throw new Error(`Failed to fetch destination sitemap: ${destSitemapRes.status}`);
  const destUrls=parseSitemap(destSitemapRes.body);
  stats.destinationsDiscovered=destUrls.length;
  console.log(`Destinations discovered: ${destUrls.length}`);
  destUrls.forEach(u=>console.log('  ',u));

  const tripSitemapRes=await fetchText(TRIP_SITEMAP);
  if(tripSitemapRes.status!==200) throw new Error(`Failed to fetch trip sitemap: ${tripSitemapRes.status}`);
  const tripUrls=parseSitemap(tripSitemapRes.body);
  stats.tripsDiscovered=tripUrls.length;
  console.log(`Trips discovered: ${tripUrls.length} (showing first 20)`);
  tripUrls.slice(0,20).forEach(u=>console.log('  ',u));

  let destToProcess=destUrls;
  let tripToProcess=tripUrls;
  if(limitDest>0) destToProcess=destUrls.slice(0, limitDest);
  if(limitTrip>0) tripToProcess=tripUrls.slice(0, limitTrip);

  const destSlugToId=new Map();
  const destNameToSlug=new Map();

  // Process destinations
  console.log('\n--- Processing Destinations ---');
  let destIdx=0;
  for(const url of destToProcess){
    destIdx++;
    const slug=new URL(url).pathname.replace(/^\//,'').replace(/\/$/,'');
    console.log(`[${destIdx}/${destToProcess.length}] ${slug}`);
    try{
      const res=await fetchText(url);
      if(res.status!==200){ console.warn(`  failed HTTP ${res.status}`); stats.failedUrls.push(url); continue; }
      const html=res.body;
      const fields=extractDestinationFields(html, slug);
      console.log(`  location=${fields.location} type=${fields.destinationType} price=${fields.startingPrice} images=${fields.coverImages.length} aboutLen=${fields.aboutPlain.length}`);

      // Download & upload images (quick mode limits to 2, normal to 3 to keep runtime reasonable)
      const gallery=[];
      let heroImage={};
      const imagesToProcess=fields.coverImages.slice(0, quick ? 2 : 3);
      stats.imagesDiscovered+=imagesToProcess.length;
      let heroUploaded=null;
      for(let i=0;i<imagesToProcess.length;i++){
        const imgUrl=imagesToProcess[i];
        if(skipMedia){ 
          const fallback={ url: imgUrl, publicId:'', alt: fields.title, secureUrl: imgUrl };
          if(i===0) heroUploaded=fallback; else gallery.push(fallback);
          continue;
        }
        try{
          const { buffer, contentType } = await fetchBuffer(imgUrl);
          const folder=i===0 ? `travel-crm/destinations/${slug}/hero` : `travel-crm/destinations/${slug}/gallery`;
          const mime=contentType || guessMimeFromUrl(imgUrl);
          const uploaded=await uploadBufferToS3(buffer, { folder, originalName: imgUrl.split('/').pop()?.split('?')[0]||`image-${i}.webp`, mimeType:mime });
          stats.imagesUploaded++;
          const imgObj={ url: uploaded.url, publicId: uploaded.publicId, secureUrl: uploaded.secureUrl, alt: fields.title, format: uploaded.format, bytes: uploaded.bytes, resourceType:'image' };
          if(i===0) heroUploaded=imgObj; else gallery.push(imgObj);
        }catch(e){
          console.warn(`  image failed ${imgUrl}: ${e.message}`);
          stats.imagesFailed++;
          // fallback to original URL
          const fallback={ url: imgUrl, publicId:'', alt: fields.title, secureUrl: imgUrl };
          if(i===0) heroUploaded=fallback; else gallery.push(fallback);
        }
        await sleep(120);
      }
      if(!heroUploaded){
        // Use cat image if no upload
        const fallbackUrl=fields.coverImages[0]||'';
        heroUploaded={ url: fallbackUrl, publicId:'', alt: fields.title, secureUrl: fallbackUrl };
      }

      const country=countryFromDestination(fields.location, fields.destinationType);
      const region=regionFromDestination(fields.location, fields.destinationType);
      const category=categoryFromType(fields.destinationType, slug);
      const shortDesc=stripHtml(fields.aboutPlain).slice(0,280);
      const longDesc=htmlToPlainWithBreaks(fields.aboutHtml) || stripHtml(fields.aboutPlain);
      // Ensure slug unique and url-safe
      const cleanSlug=slugifySimple(slug);

      const destDoc={
        name: fields.location || fields.title,
        slug: cleanSlug,
        country,
        region,
        type: 'other',
        category,
        shortDescription: shortDesc,
        description: longDesc.slice(0,8000),
        heroImage: heroUploaded,
        gallery,
        startingPrice: fields.startingPrice||null,
        currency:'INR',
        featured: destIdx<=6, // first 6 featured for homepage
        published: true,
        displayOrder: destIdx,
        seoTitle: fields.metatitle || `${fields.location} Tour Packages`,
        seoDescription: fields.metadescription || shortDesc,
        seoKeywords: fields.metakeywords || '',
      };

      if(dryRun){
        console.log(`  [dry-run] would upsert destination ${cleanSlug}`);
        stats.destinationsSkipped++;
      } else {
        const existing=await Destination.findOne({ slug: cleanSlug });
        if(existing){
          await Destination.updateOne({ slug: cleanSlug }, destDoc);
          stats.destinationsUpdated++;
          console.log(`  updated destination ${cleanSlug} id=${existing._id}`);
          destSlugToId.set(cleanSlug, existing._id);
        } else {
          const created=await Destination.create(destDoc);
          stats.destinationsImported++;
          console.log(`  created destination ${cleanSlug} id=${created._id}`);
          destSlugToId.set(cleanSlug, created._id);
        }
        destNameToSlug.set(fields.location.toLowerCase(), cleanSlug);
        // Also map title lower
        destNameToSlug.set(fields.title.toLowerCase(), cleanSlug);
      }

    }catch(e){
      console.error(`  ERROR ${slug}: ${e.message}`);
      stats.failedUrls.push(url);
    }
    await sleep(THROTTLE_MS);
  }

  // If dryRun, still need dest ids for trips? We'll skip trip creation in dryRun
  // Reload dest mapping if not dryRun and we deleted, we already have map; but if script rerun, we need to reload
  if(!dryRun){
    const allDests=await Destination.find().select('slug _id name').lean();
    for(const d of allDests){ destSlugToId.set(d.slug, d._id); destNameToSlug.set(d.name.toLowerCase(), d.slug); }
  }

  // Process trips
  console.log('\n--- Processing Trips ---');
  let tripIdx=0;
  let tripCodeCounter=1;
  // Get max existing tripCode number for incremental
  if(!dryRun){
    const last=await Trip.find({ tripCode: /^TRP-\d+$/ }).select('tripCode').sort({ tripCode:-1 }).limit(1).lean();
    if(last.length>0){ const m=last[0].tripCode.match(/^TRP-(\d+)$/); if(m) tripCodeCounter=Number(m[1])+1; }
  }

  for(const url of tripToProcess){
    tripIdx++;
    const slug=new URL(url).pathname.replace(/^\/trip\//,'').replace(/\/$/,'');
    console.log(`[${tripIdx}/${tripToProcess.length}] ${slug}`);
    try{
      const res=await fetchText(url);
      if(res.status!==200){ console.warn(`  failed HTTP ${res.status}`); stats.failedUrls.push(url); continue; }
      const html=res.body;
      const fields=extractTripFields(html, slug);
      console.log(`  title=${fields.title} loc=${fields.location} price=${fields.startingPrice} batches=${fields.batches.length} itinerary=${fields.itinerary.length} images=${fields.coverImages.length}`);

      // Find destinationId
      let destSlug=destNameToSlug.get(fields.location.toLowerCase());
      if(!destSlug){
        // try fuzzy: slug contains location lower
        const locLower=fields.location.toLowerCase();
        for(const [name, s] of destNameToSlug.entries()){
          if(locLower.includes(name) || name.includes(locLower) || s.includes(locLower.replace(/\s+/g,'-'))){
            destSlug=s; break;
          }
        }
      }
      if(!destSlug){
        // fallback: find destination whose slug is like first word of location
        const fallback=slug.split('-')[0];
        for(const s of destSlugToId.keys()) if(s.includes(fallback)) { destSlug=s; break; }
      }
      if(!destSlug){
        // create a generic destination if not found? For now pick first
        const firstDest=[...destSlugToId.keys()][0];
        destSlug=firstDest;
        console.warn(`  No destination matched for location "${fields.location}", fallback to ${destSlug}`);
      }
      const destinationId=destSlugToId.get(destSlug);
      if(!destinationId){ console.warn(`  destinationId not found for ${destSlug}, skipping`); stats.tripsSkipped++; continue; }

      // Media upload (quick=2 images, else 3)
      const coverImages=fields.coverImages.slice(0, quick ? 2 : 3);
      stats.imagesDiscovered+=coverImages.length;
      let heroImage={};
      const gallery=[];
      for(let i=0;i<coverImages.length;i++){
        const imgUrl=coverImages[i];
        if(skipMedia){
          const obj={ url: imgUrl, publicId:'', alt: fields.title, secureUrl: imgUrl };
          if(i===0) heroImage=obj; else gallery.push(obj);
          continue;
        }
        try{
          const { buffer, contentType } = await fetchBuffer(imgUrl);
          const folder=i===0 ? `travel-crm/trips/${slug}/hero` : `travel-crm/trips/${slug}/gallery`;
          const mime=contentType || guessMimeFromUrl(imgUrl);
          const uploaded=await uploadBufferToS3(buffer, { folder, originalName: imgUrl.split('/').pop()?.split('?')[0]||`trip-${i}.webp`, mimeType: mime });
          stats.imagesUploaded++;
          const obj={ url: uploaded.url, publicId: uploaded.publicId, secureUrl: uploaded.secureUrl, alt: fields.title, format: uploaded.format, bytes: uploaded.bytes, resourceType:'image' };
          if(i===0) heroImage=obj; else gallery.push(obj);
        }catch(e){
          console.warn(`  trip image failed ${imgUrl}: ${e.message}`);
          stats.imagesFailed++;
          const obj={ url: imgUrl, publicId:'', alt: fields.title, secureUrl: imgUrl };
          if(i===0) heroImage=obj; else gallery.push(obj);
        }
        await sleep(100);
      }
      if(!heroImage.url){
        const fallback=coverImages[0]||'';
        heroImage={ url: fallback, publicId:'', alt: fields.title, secureUrl: fallback };
      }

      // Build itinerary for Trip model
      const itinerary=fields.itinerary.map((d, idx)=>({
        dayNumber: idx+1,
        title: (d.title||`Day ${idx+1}`).slice(0,200),
        description: htmlToPlainWithBreaks(d.description).slice(0,2000),
        activities: [],
        meals: [],
        accommodation: '',
        notes: '',
      }));
      // Inclusions / exclusions: convert html to plain list items
      const parseListHtml=(htmlStr)=>{
        if(!htmlStr) return [];
        // Extract <li><p>text</p></li>
        const items=[...htmlStr.matchAll(/<li[^>]*>(.*?)<\/li>/gs)].map(m=>{
          const inner=m[1].replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim();
          return inner.slice(0,300);
        }).filter(Boolean);
        if(items.length>0) return items;
        // Fallback: split by lines
        const plain=htmlToPlainWithBreaks(htmlStr);
        return plain.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,20);
      };
      const inclusions=parseListHtml(fields.inclusionsHtml).slice(0,30);
      const exclusions=parseListHtml(fields.exclusionsHtml).slice(0,30);

      const cleanSlug=slugifySimple(slug);
      const shortDesc=htmlToPlainWithBreaks(fields.itinerary[0]?.description || fields.metadescription || '').slice(0,280);
      const longDesc=htmlToPlainWithBreaks(fields.itinerary.map(d=>d.description).join('\n\n') + '\n\n' + (fields.metadescription||'')).slice(0,8000);

      // Check existing trip by slug
      const existingTrip= !dryRun ? await Trip.findOne({ slug: cleanSlug }) : null;
      let tripId;
      let tripCode;
      if(existingTrip){
        tripCode=existingTrip.tripCode;
        tripId=existingTrip._id;
      } else {
        tripCode=`TRP-${String(tripCodeCounter).padStart(6,'0')}`;
        tripCodeCounter++;
      }

      const tripDoc={
        destinationId,
        name: fields.title.slice(0,160),
        slug: cleanSlug,
        tripCode,
        shortDescription: shortDesc,
        description: longDesc.slice(0,8000) || fields.title,
        tripType: tripTypeFromTitle(fields.title, fields.location),
        durationDays: fields.durationDays||7,
        durationNights: fields.durationNights||6,
        maxGroupSize: 20,
        startingPrice: fields.startingPrice||null,
        currency:'INR',
        heroImage,
        gallery,
        itinerary,
        inclusions,
        exclusions,
        importantInformation: '',
        faqs: [],
        featured: tripIdx<=12,
        published: true,
        displayOrder: tripIdx,
        seoTitle: fields.metatitle || fields.title,
        seoDescription: fields.metadescription || shortDesc,
        seoKeywords: fields.metakeywords || '',
      };

      if(dryRun){
        console.log(`  [dry-run] would upsert trip ${cleanSlug} code=${tripCode}`);
        stats.tripsSkipped++;
      } else {
        if(existingTrip){
          await Trip.updateOne({ _id: tripId }, tripDoc);
          stats.tripsUpdated++;
          console.log(`  updated trip ${cleanSlug} code=${tripCode} dest=${destSlug}`);
        } else {
          const created=await Trip.create(tripDoc);
          tripId=created._id;
          stats.tripsImported++;
          console.log(`  created trip ${cleanSlug} code=${tripCode} dest=${destSlug}`);
        }
        // Create batches for this trip
        for(const b of fields.batches){
          const depDate=new Date(b.batchDate);
          if(isNaN(depDate.getTime())) continue;
          const retDate=b.endDate ? new Date(b.endDate) : new Date(depDate.getTime() + (fields.durationDays||7)*86400000);
          const price=b.price || fields.startingPrice || 0;
          const originalPrice=b.discount ? price + b.discount : null;
          const totalSeats=b.maxSlots||30;
          const bookedSeats=totalSeats - (b.remainSlots||totalSeats);
          const batchCode=`BAT-${crypto.createHash('md5').update(`${tripId}_${depDate.toISOString()}`).digest('hex').slice(0,6).toUpperCase()}`;
          const batchDoc={
            tripId,
            batchCode,
            departureDate: depDate,
            returnDate: retDate,
            price,
            originalPrice,
            currency:'INR',
            totalSeats,
            bookedSeats: Math.max(0, bookedSeats),
            status: 'open',
            published: true,
            notes: '',
          };
          // Upsert by tripId + departureDate
          const existingBatch=await TripBatch.findOne({ tripId, departureDate: depDate });
          if(existingBatch){
            await TripBatch.updateOne({ _id: existingBatch._id }, batchDoc);
            stats.batchesUpdated++;
          } else {
            try{
              await TripBatch.create(batchDoc);
              stats.batchesCreated++;
            }catch(e){
              if(e.code===11000){
                // duplicate batchCode, try with random suffix
                batchDoc.batchCode=`BAT-${crypto.randomUUID().slice(0,6).toUpperCase()}`;
                await TripBatch.create(batchDoc);
                stats.batchesCreated++;
              } else throw e;
            }
          }
        }
      }

    }catch(e){
      console.error(`  ERROR ${slug}: ${e.message} ${e.stack?.slice(0,500)}`);
      stats.failedUrls.push(url);
    }
    await sleep(THROTTLE_MS);
  }

  // Migration summary
  console.log('\n=== Migration completed ===');
  console.log(`Destinations discovered: ${stats.destinationsDiscovered}`);
  console.log(`Destinations imported: ${stats.destinationsImported}`);
  console.log(`Destinations updated: ${stats.destinationsUpdated}`);
  console.log(`Destinations skipped: ${stats.destinationsSkipped}`);
  console.log(`Trips discovered: ${stats.tripsDiscovered}`);
  console.log(`Trips imported: ${stats.tripsImported}`);
  console.log(`Trips updated: ${stats.tripsUpdated}`);
  console.log(`Trips skipped: ${stats.tripsSkipped}`);
  console.log(`Images discovered: ${stats.imagesDiscovered}`);
  console.log(`Images uploaded to S3: ${stats.imagesUploaded}`);
  console.log(`Images failed: ${stats.imagesFailed}`);
  console.log(`TripBatches created: ${stats.batchesCreated}`);
  console.log(`TripBatches updated: ${stats.batchesUpdated}`);
  const createdCount=stats.destinationsImported + stats.tripsImported + stats.batchesCreated;
  const updatedCount=stats.destinationsUpdated + stats.tripsUpdated + stats.batchesUpdated;
  console.log(`MongoDB records created: ${createdCount}`);
  console.log(`MongoDB records updated: ${updatedCount}`);
  if(stats.failedUrls.length>0){
    console.log(`Failed URLs (${stats.failedUrls.length}):`);
    stats.failedUrls.forEach(u=>console.log('  ',u));
  } else {
    console.log('Failed URLs: (none)');
  }

  // Verification
  const finalDests=await Destination.countDocuments();
  const finalTrips=await Trip.countDocuments();
  const finalBatches=await TripBatch.countDocuments();
  console.log(`\nVerification: DB ${mongoose.connection.name} -> destinations=${finalDests} trips=${finalTrips} batches=${finalBatches}`);
  const sampleDests=await Destination.find().limit(3).select('slug name category country heroImage.url').lean();
  console.log('Sample destinations:', JSON.stringify(sampleDests, null, 2));
  const sampleTrips=await Trip.find().limit(2).select('slug name destinationId heroImage.url startingPrice').lean();
  console.log('Sample trips:', JSON.stringify(sampleTrips, null, 2));

  await mongoose.disconnect();
  console.log('Done');
}

main().catch(e=>{ console.error(e); process.exit(1); });
