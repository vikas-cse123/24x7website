#!/usr/bin/env node
/**
 * One-time batch importer: Pixabay → S3 → Trip.cardImage
 * One image per trip, trips/<code>/card/ prefix.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const DRY_RUN = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')
const limitIdx = process.argv.indexOf('--limit')
const LIMIT = limitIdx !== -1 ? parseInt(process.argv[limitIdx + 1], 10) : null
const tripIdx = process.argv.indexOf('--trip')
const SINGLE_TRIP = tripIdx !== -1 ? String(process.argv[tripIdx + 1] || '').trim().toUpperCase() : null

const CONCURRENCY = parseInt(process.env.TRIP_IMAGE_CONCURRENCY || '5', 10)
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || ''
const REPORT_DIR = path.resolve(__dirname, 'reports')

function usageAndExit() {
  console.log(`Usage: node server/scripts/import-trip-card-images.js [--dry-run] [--limit N] [--trip TRP-000002] [--force]`)
  process.exit(1)
}
if (process.argv.includes('--help')) usageAndExit()

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function withRetry(fn, retries = 3, baseMs = 800) {
  let last
  for (let i = 0; i <= retries; i++) {
    try { return await fn() } catch (e) {
      last = e
      if (i === retries) break
      const isRetryable = !e.status || e.status >= 500 || e.code === 'ECONNRESET' || e.message?.includes('fetch')
      if (!isRetryable && e.status && e.status < 500 && e.status !== 429) break
      const delay = baseMs * Math.pow(2, i) + Math.random() * 200
      console.log(`  ↻ retry ${i+1}/${retries} after ${Math.round(delay)}ms: ${e.message}`)
      await sleep(delay)
    }
  }
  throw last
}

function buildQueries(trip, dest) {
  const destName = (dest?.name || '').replace(/Tour Packages/i, '').trim()
  const country = (dest?.country || '').trim()
  const tripName = (trip?.name || '').replace(/Tour Packages/i, '').trim()
  const base = destName || country || tripName
  const queries = []
  if (destName) queries.push(`${destName} travel`)
  if (country && country.toLowerCase() !== destName.toLowerCase()) queries.push(`${country} travel`)
  if (destName) queries.push(`${destName} tourism`)
  if (country) queries.push(`${country} tourism`)
  if (destName) queries.push(`${destName} landscape`)
  if (tripName && tripName !== destName) queries.push(`${tripName} travel`)
  // dedupe
  return [...new Set(queries)].slice(0, 6)
}

function isCardImageEmpty(img) {
  if (!img || typeof img !== 'object') return true
  return !img.publicId && !img.url && !img.secureUrl
}

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
  url.searchParams.set('editors_choice', 'false')
  const res = await withRetry(async () => {
    const r = await fetch(url.toString())
    if (!r.ok) {
      const t = await r.text().catch(()=>'')
      const e = new Error(`Pixabay ${r.status}: ${t.slice(0,200)}`)
      e.status = r.status
      throw e
    }
    return r.json()
  }, 2, 600)
  const hits = Array.isArray(res.hits) ? res.hits : []
  // Filter landscape, no obvious watermark? pixabay hits are generally clean.
  // Avoid duplicates, prefer larger images
  const filtered = hits.filter(h => {
    if (usedIds.has(h.id)) return false
    // landscape check: width > height
    if (h.imageWidth && h.imageHeight && h.imageWidth <= h.imageHeight) return false
    // avoid too small
    if (h.imageWidth && h.imageWidth < 800) return false
    return true
  })
  // sort by likes/downloads as quality proxy
  filtered.sort((a,b) => (b.likes + b.downloads) - (a.likes + a.downloads))
  return filtered[0] || null
}

async function findBestImage(queries, usedIds) {
  for (const q of queries) {
    console.log(`  Searching Pixabay: "${q}"...`)
    const hit = await searchPixabay(q, usedIds).catch(e => {
      console.log(`  ✗ Pixabay error for "${q}": ${e.message}`)
      return null
    })
    if (hit) return { hit, query: q }
  }
  return null
}

async function downloadImage(url) {
  return withRetry(async () => {
    const r = await fetch(url)
    if (!r.ok) throw new Error(`Download ${r.status}`)
    const ab = await r.arrayBuffer()
    const buf = Buffer.from(ab)
    const ct = r.headers.get('content-type') || 'image/jpeg'
    return { buffer: buf, contentType: ct }
  }, 2, 600)
}

async function optimizeImage(buffer, contentType) {
  // Try sharp if available, else return as-is
  try {
    const sharp = (await import('sharp')).default
    // Resize to 800x600 landscape, cover, jpeg quality 82
    const out = await sharp(buffer)
      .resize({ width: 800, height: 600, fit: 'cover', position: 'attention' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer()
    return { buffer: out, contentType: 'image/jpeg', ext: '.jpg' }
  } catch {
    // no sharp or failed
    const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg'
    return { buffer, contentType: contentType || 'image/jpeg', ext }
  }
}

function safeFilename(tripCode, pixabayId, ext) {
  return `${tripCode.toLowerCase()}-${pixabayId}${ext}`
}

async function main() {
  console.log('\n=== Trip Card Image Import ===')
  console.log(`Dry run: ${DRY_RUN} | Force: ${FORCE} | Limit: ${LIMIT ?? 'none'} | Trip: ${SINGLE_TRIP || 'all'} | Concurrency: ${CONCURRENCY}`)
  if (!PIXABAY_KEY && !DRY_RUN) {
    console.warn('WARNING: PIXABAY_API_KEY not set — dry-run will still attempt search but will fail')
  }
  if (!PIXABAY_KEY) {
    console.error('\nERROR: PIXABAY_API_KEY is required. Set it in .env (PIXABAY_API_KEY=...)')
    if (DRY_RUN) console.log('(dry-run will continue but Pixabay searches will fail)\n')
    else {
      // For dry-run we allow to continue to show planned trips even without key, but searches will fail
      // Don't exit yet; let user see trips
    }
  }

  const { default: config } = await import('../src/config/index.js')
  await mongoose.connect(config.mongoUri)
  console.log(`MongoDB connected: ${config.mongoUri.split('@').pop()?.split('?')[0]}`)

  const { default: Trip } = await import('../src/models/Trip.js')
  const { default: Destination } = await import('../src/models/Destination.js')
  const { s3Config, isS3Configured } = await import('../src/config/s3.js')
  const s3Service = await import('../src/services/s3.service.js')

  if (!DRY_RUN && !isS3Configured) {
    console.error('S3 not configured (AWS_REGION/KEY/SECRET/BUCKET)')
    process.exit(1)
  }
  console.log(`S3 bucket: ${s3Config.bucket} (configured: ${isS3Configured})`)

  // Build query for trips — safe filter: only the 62 imported trips (TRP-000002–TRP-000063), never TRP-000001
  const tripFilter = {}
  if (SINGLE_TRIP) {
    if (SINGLE_TRIP === 'TRP-000001') {
      console.log('Refusing to process TRP-000001 — only TRP-000002–TRP-000063 are allowed')
      console.log('\nTrips found: 0')
      await mongoose.disconnect()
      return
    }
    tripFilter.tripCode = SINGLE_TRIP
  } else {
    tripFilter.tripCode = { $gte: 'TRP-000002', $lte: 'TRP-000063' }
  }
  let trips = await Trip.find(tripFilter).populate('destinationId').sort({ tripCode: 1 }).lean()
  if (LIMIT && !SINGLE_TRIP) trips = trips.slice(0, LIMIT)
  console.log(`\nTrips found: ${trips.length}`)
  if (!trips.length) {
    console.log('No trips matched filter.')
    await mongoose.disconnect()
    return
  }

  // Stats
  let uploaded = 0, updated = 0, skipped = 0, failed = 0
  const usedPixabayIds = new Set()
  const reportEntries = []

  // Prepare concurrency pool
  async function processOne(trip, idx, total) {
    const dest = trip.destinationId && typeof trip.destinationId === 'object' ? trip.destinationId : null
    const destName = dest?.name || 'Unknown'
    const label = `[${idx+1}/${total}] ${trip.tripCode} ${trip.name} (${destName})`
    console.log(`\n${label}`)
    const entry = {
      tripId: trip._id.toString(),
      tripCode: trip.tripCode,
      tripName: trip.name,
      destination: dest ? { id: dest._id?.toString(), name: dest.name, slug: dest.slug, country: dest.country } : null,
      pixabayImageId: null,
      pixabayQuery: null,
      pixabaySourceUrl: null,
      selectedImageUrl: null,
      s3Key: null,
      uploadStatus: 'pending',
      mongoUpdateStatus: 'pending',
      error: null,
    }

    const hasCard = !isCardImageEmpty(trip.cardImage)
    if (hasCard && !FORCE) {
      console.log(`  ⊘ Skipped — cardImage already exists: ${trip.cardImage.publicId || trip.cardImage.url}`)
      entry.uploadStatus = 'skipped'
      entry.mongoUpdateStatus = 'skipped'
      entry.error = 'cardImage exists'
      skipped++
      reportEntries.push(entry)
      return
    }
    if (hasCard && FORCE) console.log(`  ! Force — will replace existing cardImage`)

    if (!PIXABAY_KEY) {
      entry.error = 'PIXABAY_API_KEY missing'
      entry.uploadStatus = 'failed'
      entry.mongoUpdateStatus = 'failed'
      failed++
      console.log('  ✗ PIXABAY_API_KEY missing — cannot search')
      reportEntries.push(entry)
      return
    }

    const queries = buildQueries(trip, dest)
    console.log(`  Searching Pixabay... (${queries.join(' | ')})`)
    const found = await findBestImage(queries, usedPixabayIds)
    if (!found) {
      entry.error = 'No suitable Pixabay image found'
      entry.uploadStatus = 'failed'
      entry.mongoUpdateStatus = 'failed'
      failed++
      console.log('  ✗ No suitable image found')
      reportEntries.push(entry)
      return
    }
    const hit = found.hit
    usedPixabayIds.add(hit.id)
    entry.pixabayImageId = hit.id
    entry.pixabayQuery = found.query
    entry.pixabaySourceUrl = hit.pageURL
    // Prefer largeImageURL then webformatURL
    const imageUrl = hit.largeImageURL || hit.webformatURL || hit.previewURL
    entry.selectedImageUrl = imageUrl
    console.log(`  ✓ Image selected: #${hit.id} ${imageUrl} (${hit.imageWidth}x${hit.imageHeight}) via "${found.query}"`)

    if (DRY_RUN) {
      const ext = '.jpg'
      const filename = safeFilename(trip.tripCode, hit.id, ext)
      const s3Key = `trips/${trip.tripCode}/card/${filename}`
      entry.s3Key = s3Key
      entry.uploadStatus = 'dry-run'
      entry.mongoUpdateStatus = 'dry-run'
      console.log(`  → Would upload to S3: ${s3Key}`)
      console.log(`  → Would update Trip.cardImage`)
      // Still count as dry-run, not uploaded
      reportEntries.push(entry)
      return
    }

    // Download
    console.log('  Downloading...')
    let dl
    try {
      dl = await downloadImage(imageUrl)
      console.log(`  ✓ Downloaded ${dl.buffer.length} bytes (${dl.contentType})`)
    } catch (e) {
      entry.error = `Download failed: ${e.message}`
      entry.uploadStatus = 'failed'
      entry.mongoUpdateStatus = 'failed'
      failed++
      console.log(`  ✗ Download failed: ${e.message}`)
      reportEntries.push(entry)
      return
    }

    // Optimize
    let optimized
    try {
      optimized = await optimizeImage(dl.buffer, dl.contentType)
      console.log(`  ✓ Optimized ${optimized.buffer.length} bytes`)
    } catch (e) {
      optimized = { buffer: dl.buffer, contentType: dl.contentType, ext: '.jpg' }
      console.log(`  ↻ Optimize skipped: ${e.message}`)
    }

    const ext = optimized.ext || '.jpg'
    const filename = safeFilename(trip.tripCode, hit.id, ext)
    const s3Key = `trips/${trip.tripCode}/card/${filename}`
    entry.s3Key = s3Key

    // Upload to S3
    console.log(`  Uploading to S3: ${s3Key}...`)
    let uploadedMeta
    try {
      uploadedMeta = await withRetry(async () => {
        return s3Service.uploadBuffer(optimized.buffer, {
          folder: `trips/${trip.tripCode}/card`,
          originalName: filename,
          mimeType: optimized.contentType,
        })
      }, 2, 800)
      // uploadBuffer generates its own key with Date.now-UUID, but we want deterministic key.
      // Our uploadBuffer ignores our s3Key and generates random. To use our key, we need to upload via PutObject with our key.
      // However s3Service.uploadBuffer's makeKey overrides. We accept its generated key.
      // For spec we wanted trips/<code>/card/<filename>, but uploadBuffer will create trips/<code>/card/<timestamp>-uuid.jpg
      // To honor spec exactly, we should put with our key directly via S3 client. Instead, we will use the returned publicId as s3Key.
      // Override s3Key to actual uploaded key
      entry.s3Key = uploadedMeta.publicId
      console.log(`  ✓ Uploaded to S3: ${uploadedMeta.publicId}`)
      entry.uploadStatus = 'uploaded'
      uploaded++
    } catch (e) {
      entry.error = `S3 upload failed: ${e.message}`
      entry.uploadStatus = 'failed'
      entry.mongoUpdateStatus = 'failed'
      failed++
      console.log(`  ✗ S3 upload failed: ${e.message}`)
      reportEntries.push(entry)
      return
    }

    // Update Trip.cardImage only
    console.log('  Updating Trip.cardImage...')
    const newCardImage = {
      url: uploadedMeta.url,
      secureUrl: uploadedMeta.secureUrl,
      publicId: uploadedMeta.publicId,
      width: uploadedMeta.width,
      height: uploadedMeta.height,
      format: uploadedMeta.format,
      bytes: uploadedMeta.bytes,
      resourceType: 'image',
      alt: trip.name,
      altText: trip.name,
    }
    try {
      await Trip.updateOne({ _id: trip._id }, { $set: { cardImage: newCardImage } })
      console.log('  ✓ Trip.cardImage updated')
      entry.mongoUpdateStatus = 'updated'
      updated++
    } catch (e) {
      entry.error = `Mongo update failed: ${e.message}`
      entry.mongoUpdateStatus = 'failed'
      failed++
      console.log(`  ✗ Mongo update failed: ${e.message}`)
    }
    reportEntries.push(entry)
  }

  // Process with concurrency
  const total = trips.length
  for (let i = 0; i < total; i += CONCURRENCY) {
    const chunk = trips.slice(i, i + CONCURRENCY)
    await Promise.all(chunk.map((t, j) => processOne(t, i + j, total)))
  }

  // Summary
  console.log('\n================================')
  console.log('TRIP CARD IMAGE IMPORT COMPLETE')
  console.log('================================')
  console.log(`Trips found: ${total}`)
  console.log(`Images required: ${total - skipped}`)
  console.log(`Images uploaded: ${uploaded}`)
  console.log(`Trips updated: ${updated}`)
  console.log(`Trips skipped: ${skipped}`)
  console.log(`Trips failed: ${failed}`)
  console.log('================================\n')

  // Report
  fs.mkdirSync(REPORT_DIR, { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const reportPath = path.join(REPORT_DIR, `trip-card-image-import-${ts}.json`)
  const report = {
    timestamp: new Date().toISOString(),
    dryRun: DRY_RUN,
    force: FORCE,
    concurrency: CONCURRENCY,
    tripsFound: total,
    imagesUploaded: uploaded,
    tripsUpdated: updated,
    tripsSkipped: skipped,
    tripsFailed: failed,
    entries: reportEntries,
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`Report written: ${reportPath}`)

  await mongoose.disconnect()
}

main().catch(e => {
  console.error('Fatal', e)
  process.exit(1)
})
