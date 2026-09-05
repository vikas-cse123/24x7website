import { Router } from 'express'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { s3Client, s3Config } from '../config/s3.js'
import { isAppKey } from '../utils/imageFolders.js'

const router = Router()

// Public S3 proxy — streams private S3 objects through the backend so the
// browser never needs direct S3 public-read. Works for both legacy
// `travel-crm/*` and new clean prefixes (`destinations/`, `vibe-videos/`, etc.).
// Keeps folder mappings unchanged; only delivery changes.
router.get('/*', async (req, res, next) => {
  try {
    // req.params[0] is the wildcard part when mounted as /api/media/*
    // Express 4 with /* gives req.params[0]; fallback to query or path
    let key = req.params[0] || req.params['0'] || ''
    // Fallback: derive from originalUrl when params not populated
    if (!key) {
      const prefix = '/api/media/'
      const idx = req.originalUrl.indexOf(prefix)
      if (idx !== -1) {
        key = req.originalUrl.slice(idx + prefix.length).split('?')[0]
        key = decodeURIComponent(key)
      }
    }
    key = decodeURIComponent(key)

    if (!key || !isAppKey(key)) {
      return res.status(404).json({ success: false, message: 'Media not found' })
    }
    if (!s3Client || !s3Config.bucket) {
      return res.status(503).json({ success: false, message: 'S3 not configured' })
    }

    const result = await s3Client.send(new GetObjectCommand({ Bucket: s3Config.bucket, Key: key }))

    if (result.ContentType) res.setHeader('Content-Type', result.ContentType)
    if (result.ContentLength) res.setHeader('Content-Length', result.ContentLength)
    if (result.CacheControl) res.setHeader('Cache-Control', result.CacheControl)
    else res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    if (result.ETag) res.setHeader('ETag', result.ETag)
    // CORS for proxied media — allow any origin (images are public content)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')

    // Support range requests (video streaming)
    if (req.headers.range && result.ContentLength) {
      // For simplicity, let S3 handle range via GetObject with Range header
      // Re-fetch with Range if requested
      try {
        const rangeResult = await s3Client.send(new GetObjectCommand({
          Bucket: s3Config.bucket, Key: key, Range: req.headers.range,
        }))
        if (rangeResult.ContentRange) res.setHeader('Content-Range', rangeResult.ContentRange)
        if (rangeResult.ContentLength) res.setHeader('Content-Length', rangeResult.ContentLength)
        res.status(206)
        rangeResult.Body.pipe(res)
        return
      } catch (_) {
        // fall through to full body
      }
    }

    result.Body.pipe(res)
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NoSuchKey') {
      return res.status(404).json({ success: false, message: 'Media not found' })
    }
    next(err)
  }
})

export default router
