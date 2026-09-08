import { Router } from 'express'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Client, s3Config } from '../config/s3.js'
import { isAppKey } from '../utils/imageFolders.js'

const router = Router()

// Presigned URL for homepage hero video — private bucket, direct S3 delivery.
// Whitelisted to a single key; do NOT make generic. Bucket stays private,
// no public policy, no CloudFront, no proxy streaming for this hero video.
// Browser flow: GET /api/media/presign -> { url } -> browser GETs S3 directly (supports Range).
const HERO_VIDEO_KEY = 'website/home/video_web/home-video.mp4'
const HERO_PRESIGN_EXPIRES = 3600 // 1 hour

router.get('/presign', async (req, res, next) => {
  try {
    const raw = req.query.key
    const requestedKey = raw != null && String(raw).length > 0 ? String(raw) : HERO_VIDEO_KEY
    if (requestedKey !== HERO_VIDEO_KEY) {
      return res.status(403).json({ success: false, message: 'Forbidden: only hero video may be presigned' })
    }
    if (!s3Client || !s3Config.bucket) {
      return res.status(503).json({ success: false, message: 'S3 not configured' })
    }
    const command = new GetObjectCommand({ Bucket: s3Config.bucket, Key: HERO_VIDEO_KEY })
    const url = await getSignedUrl(s3Client, command, { expiresIn: HERO_PRESIGN_EXPIRES })
    return res.json({ success: true, url, key: HERO_VIDEO_KEY, expiresIn: HERO_PRESIGN_EXPIRES })
  } catch (err) {
    next(err)
  }
})

// Presigned URL for Vibe With Us reels — private bucket, direct S3 bytes.
// Whitelisted strictly to vibe-videos/ prefix; do NOT allow arbitrary keys.
// Browser flow: GET /api/media/presign-vibe?key=vibe-videos/... -> { url } -> browser GETs S3 directly (Range).
const VIBE_PREFIX = 'vibe-videos/'
const VIBE_PRESIGN_EXPIRES = 3600 // 1 hour, consistent with hero

router.get('/presign-vibe', async (req, res, next) => {
  try {
    const raw = req.query.key
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Missing key' })
    }
    const key = decodeURIComponent(String(raw).trim())
    // Strict whitelist: must be vibe-videos/ and pass isAppKey and not contain traversal
    if (!key.startsWith(VIBE_PREFIX) || !isAppKey(key) || key.includes('..') || key.includes('//')) {
      return res.status(403).json({ success: false, message: 'Forbidden: only vibe-videos may be presigned' })
    }
    // Enforce mp4 within vibe-videos (prevent signing images or other objects if mixed)
    if (!key.endsWith('.mp4') || key.includes('\\')) {
      return res.status(403).json({ success: false, message: 'Forbidden: only vibe mp4 may be presigned' })
    }
    if (!s3Client || !s3Config.bucket) {
      return res.status(503).json({ success: false, message: 'S3 not configured' })
    }
    const command = new GetObjectCommand({ Bucket: s3Config.bucket, Key: key })
    const url = await getSignedUrl(s3Client, command, { expiresIn: VIBE_PRESIGN_EXPIRES })
    return res.json({ success: true, url, key, expiresIn: VIBE_PRESIGN_EXPIRES })
  } catch (err) {
    next(err)
  }
})

// Presigned URL for images — private bucket, direct S3 bytes.
// Validates against isAppKey + image extension whitelist; bucket stays private.
// Browser flow: GET /api/media/presign-image?key=destinations/... -> { url } -> browser GETs S3 directly.
const IMAGE_PRESIGN_EXPIRES = 3600 // 1 hour, consistent with hero/vibe
const IMAGE_EXT_RE = /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i

router.get('/presign-image', async (req, res, next) => {
  try {
    const raw = req.query.key
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Missing key' })
    }
    const key = decodeURIComponent(String(raw).trim())
    // Validate: app key, no traversal, image extension, no backslashes
    if (!isAppKey(key) || key.includes('..') || key.includes('//') || key.includes('\\')) {
      return res.status(403).json({ success: false, message: 'Forbidden: invalid image key' })
    }
    if (!IMAGE_EXT_RE.test(key)) {
      return res.status(403).json({ success: false, message: 'Forbidden: only image extensions may be presigned' })
    }
    if (!s3Client || !s3Config.bucket) {
      return res.status(503).json({ success: false, message: 'S3 not configured' })
    }
    const command = new GetObjectCommand({ Bucket: s3Config.bucket, Key: key })
    const url = await getSignedUrl(s3Client, command, { expiresIn: IMAGE_PRESIGN_EXPIRES })
    return res.json({ success: true, url, key, expiresIn: IMAGE_PRESIGN_EXPIRES })
  } catch (err) {
    next(err)
  }
})

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
