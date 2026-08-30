import https from 'https';
function get(url){return new Promise((res,rej)=>{https.get(url,{headers:{'User-Agent':'Mozilla/5.0'}},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res({body:d}))}).on('error',rej)})}
const res = await get('https://www.captureatrip.com/');
const html = res.body;
console.log('html length', html.length);
 // Find flight pushes
const pushes=[...html.matchAll(/self\.__next_f\.push\(\[1,"(.*?)"\]\)/gs)].map(m=>m[1]);
let combined=pushes.join('');
let decoded=combined.replace(/\\"/g,'"').replace(/\\\\/g,'\\');
console.log('decoded length', decoded.length);
 // Search for weekend
const weekendIdx = decoded.toLowerCase().indexOf('weekend');
console.log('weekend idx', weekendIdx);
if (weekendIdx !== -1) {
  console.log(decoded.slice(Math.max(0,weekendIdx-3000), weekendIdx+3000).slice(0,5000));
}
 // Search for destinationType
const destTypes=[...decoded.matchAll(/"destinationType"\s*:\s*"([^"]+)"/g)].map(m=>m[1]);
console.log('destTypes distinct', [...new Set(destTypes)]);

 // Search for category
const cats=[...decoded.matchAll(/"category"\s*:\s*"([^"]+)"/g)].map(m=>m[1]);
console.log('cats', [...new Set(cats)].slice(0,20));

 // Try to find weekend category pages in sitemap
const catRes = await get('https://www.captureatrip.com/category/sitemap.xml');
console.log('category sitemap snippet', catRes.body.slice(0,2000));

 // Try to fetch one weekend page and see its destinations
const weekendPage = await get('https://www.captureatrip.com/category/weekend-trip-from-delhi');
console.log('weekend page length', weekendPage.body.length);
const weekendPushes=[...weekendPage.body.matchAll(/self\.__next_f\.push\(\[1,"(.*?)"\]\)/gs)].map(m=>m[1]);
let wDecoded=weekendPushes.join('').replace(/\\"/g,'"').replace(/\\\\/g,'\\');
console.log('weekend decoded has destinations?', wDecoded.includes('Bali') ? 'yes' : 'no');
 // Extract all destination slugs from homepage decoded
const slugs=[...decoded.matchAll(/"slug"\s*:\s*"([^"]+)"/g)].map(m=>m[1]);
console.log('slugs sample', slugs.slice(0,20));
