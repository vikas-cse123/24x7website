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

    const range = req.headers.range
    const result = await s3Client.send(new GetObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      ...(range ? { Range: range } : {}),
    }))

    if (result.ContentType) res.setHeader('Content-Type', result.ContentType)
    if (result.ContentLength != null) res.setHeader('Content-Length', result.ContentLength)
    if (result.CacheControl) res.setHeader('Cache-Control', result.CacheControl)
    else res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    if (result.ETag) res.setHeader('ETag', result.ETag)
    if (result.LastModified) res.setHeader('Last-Modified', result.LastModified.toUTCString())
    if (result.AcceptRanges) res.setHeader('Accept-Ranges', result.AcceptRanges)
    else res.setHeader('Accept-Ranges', 'bytes')
    if (result.ContentRange) res.setHeader('Content-Range', result.ContentRange)
    // CORS for proxied media — allow any origin (images are public content)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')

    const isPartial = Boolean(range && result.ContentRange)
    if (isPartial) res.status(206)

    const body = result.Body
    if (!body || typeof body.pipe !== 'function') {
      return res.end()
    }

    const onClose = () => {
      try {
        if (typeof body.destroy === 'function') body.destroy()
      } catch {}
    }
    req.on('close', onClose)
    body.on('error', (err) => {
      req.off('close', onClose)
      if (!res.headersSent) return
      try { if (!res.writableEnded) res.end() } catch {}
      console.error('[mediaProxy] S3 stream error:', err?.message || err)
    })
    body.on('end', () => req.off('close', onClose))
    body.pipe(res)
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NoSuchKey') {
      return res.status(404).json({ success: false, message: 'Media not found' })
    }
    next(err)
  }
})

export default router
