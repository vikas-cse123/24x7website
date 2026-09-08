#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const PIXABAY_KEY = process.env.PIXABAY_API_KEY || ''
if (!PIXABAY_KEY) {
  console.error('PIXABAY_API_KEY missing in .env')
  process.exit(1)
}

const BLOGS = [
  { title: 'Things To Do in Bali', queries: ['Bali travel', 'Bali beach', 'Bali temples'] },
  { title: 'Uncover The Things To Do In Japan: A Guide To Your Ultimate Adventure', queries: ['Japan travel', 'Tokyo Japan', 'Kyoto Japan'] },
  { title: '25 Best Things to Do in Ladakh for an Unforgettable Trip', queries: ['Ladakh', 'Ladakh mountains', 'Leh Ladakh'] },
  { title: 'Places To Visit in Kasauli: A Comprehensive Travel Guide', queries: ['Kasauli', 'Himachal Pradesh mountains', 'Himachal travel'] },
  { title: 'Get To Know The Best Places To Visit In Vietnam', queries: ['Vietnam travel', 'Vietnam landscape', 'Ha Long Bay'] },
]

async function searchPixabay(query, usedIds) {
  const url = new URL('https://pixabay.com/api/')
  url.searchParams.set('key', PIXABAY_KEY)
  url.searchParams.set('q', query)
  url.searchParams.set('image_type', 'photo')
  url.searchParams.set('orientation', 'horizontal')
  url.searchParams.set('category', 'travel')
  url.searchParams.set('per_page', '10')
  url.searchParams.set('order', 'popular')
  url.searchParams.set('safesearch', 'true')
  const r = await fetch(url.toString())
  if (!r.ok) throw new Error(`Pixabay ${r.status}`)
  const j = await r.json()
  const hits = (j.hits || []).filter(h => !usedIds.has(h.id) && h.imageWidth > h.imageHeight && h.imageWidth >= 800)
  hits.sort((a,b)=>(b.likes+b.downloads)-(a.likes+a.downloads))
  return hits[0] || null
}

async function download(url, retries=3) {
  for (let i=0;i<=retries;i++) {
    const r = await fetch(url)
    if (r.ok) {
      const buf = Buffer.from(await r.arrayBuffer())
      const ct = r.headers.get('content-type') || 'image/jpeg'
      return { buf, ct }
    }
    if (r.status===429 && i<retries) {
      const wait = 1500 * (i+1)
      console.log(`  429 retry ${i+1} wait ${wait}ms`)
      await new Promise(res=>setTimeout(res, wait))
      continue
    }
    throw new Error(`Download ${r.status}`)
  }
}

async function optimize(buf, ct) {
  try {
    const sharp = (await import('sharp')).default
    const out = await sharp(buf).resize({ width: 1200, height: 800, fit: 'cover' }).jpeg({ quality: 82 }).toBuffer()
    return { buf: out, ct: 'image/jpeg', ext: '.jpg' }
  } catch {
    const ext = ct.includes('png') ? '.png' : '.jpg'
    return { buf, ct, ext }
  }
}

const { default: config } = await import('../src/config/index.js')
await mongoose.connect(config.mongoUri)
const { default: Blog } = await import('../src/models/Blog.js')
const { s3Config } = await import('../src/config/s3.js')
const s3Service = await import('../src/services/s3.service.js')

console.log(`S3 bucket ${s3Config.bucket}`)

const used = new Set()
const results = []

for (const b of BLOGS) {
  const blog = await Blog.findOne({ title: b.title }).lean()
  if (!blog) { console.log(`NOT FOUND ${b.title}`); continue }
  console.log(`\n=== ${b.title} ===`)
  let hit = null, qUsed = null
  for (const q of b.queries) {
    console.log(` Searching "${q}"...`)
    hit = await searchPixabay(q, used)
    if (hit) { qUsed = q; break }
  }
  if (!hit) { console.log('  No hit'); continue }
  used.add(hit.id)
  const imageUrl = hit.largeImageURL || hit.webformatURL
  console.log(` Selected #${hit.id} ${imageUrl} ${hit.imageWidth}x${hit.imageHeight} via "${qUsed}"`)
  const dl = await download(imageUrl)
  console.log(` Downloaded ${dl.buf.length} bytes`)
  const opt = await optimize(dl.buf, dl.ct)
  console.log(` Optimized ${opt.buf.length} bytes`)
  const filename = `${blog.slug}-${hit.id}${opt.ext}`
  const meta = await s3Service.uploadBuffer(opt.buf, { folder: 'website/blogs', originalName: filename, mimeType: opt.ct })
  console.log(` Uploaded ${meta.publicId}`)
  // Update coverImage
  const newCover = {
    url: meta.url,
    secureUrl: meta.secureUrl,
    publicId: meta.publicId,
    width: meta.width,
    height: meta.height,
    format: meta.format,
    bytes: meta.bytes,
    resourceType: 'image',
    alt: b.title,
    altText: b.title,
  }
  await Blog.updateOne({ _id: blog._id }, { $set: { coverImage: newCover } })
  console.log(` Updated Blog ${blog.slug}`)
  results.push({ title: b.title, slug: blog.slug, pixabayId: hit.id, pixabayUrl: hit.pageURL, selected: imageUrl, s3Key: meta.publicId })
}

console.log('\n=== DONE ===')
results.forEach(r=> console.log(`${r.title} -> ${r.s3Key} (pixabay ${r.pixabayId})`))

// Verify
for (const r of results) {
  const b = await Blog.findOne({ slug: r.slug }).lean()
  console.log(`${r.slug} coverImage ${b.coverImage?.publicId} url ${b.coverImage?.url?.slice(0,60)}`)
  // Check proxy load
  const proxy = `http://localhost:5000/api/media/${r.s3Key}`
  try {
    const resp = await fetch(proxy, { method: 'HEAD' })
    console.log(`  HEAD ${proxy} -> ${resp.status}`)
  } catch(e){ console.log('  HEAD failed', e.message)}
}

await mongoose.disconnect()

fs.writeFileSync(path.join(__dirname, 'reports', `blog-cover-import-${Date.now()}.json`), JSON.stringify(results, null, 2))
console.log('Report written')
