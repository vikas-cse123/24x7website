import crypto from 'node:crypto'
import path from 'node:path'
import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { s3Client, isS3Configured, s3Config } from '../config/s3.js'
import { LEGACY_KEY_PREFIX, KEY_PREFIXES, isAppKey } from '../utils/imageFolders.js'

// Safety: the app may only ever touch objects under its own media prefixes.
// Both the legacy `travel-crm/` prefix (existing records still reference it)
// and the new clean top-level prefixes are accepted; anything else — and any
// path-traversal segment — is rejected.
const ALLOWED_LOGO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function assertConfigured() {
  if (!isS3Configured || !s3Client) {
    const err = new Error('S3 storage is not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_S3_BUCKET env vars.')
    err.status = 503
    throw err
  }
}

function assertSafeKey(key) {
  if (!key) {
    const err = new Error('Object key is required')
    err.status = 400
    throw err
  }
  // Must be within an app-managed prefix and must not contain path-traversal segments.
  if (!isAppKey(key) || /(^|\/)\.\.(\/|$)/.test(key)) {
    const err = new Error(
      `Forbidden: key must be within ${LEGACY_KEY_PREFIX} or one of: ${KEY_PREFIXES.join(', ')}`
    )
    err.status = 403
    throw err
  }
}

// Build a unique object key under the given folder, e.g.
// destinations/<timestamp>-<uuid>.jpg
// The original filename is never used directly as the key.
function makeKey(folder, originalName = '', mimeType = '') {
  const base = (folder || 'website').replace(/^\/+|\/+$/g, '').replace(/\/+$/g, '')
  const ext = path.extname(originalName || '').toLowerCase() || mimeToExt(mimeType)
  const unique = `${Date.now()}-${crypto.randomUUID()}${ext}`
  return `${base}/${unique}`
}

function mimeToExt(mimeType = '') {
  const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }
  return map[mimeType] || ''
}

// Upload a Buffer directly to S3 and return the S3-compatible metadata object.
// Callers persist this metadata; it carries everything needed to retrieve or
// delete the object later (the object key is stored as `publicId`).
export async function uploadBuffer(buffer, { folder, originalName, mimeType } = {}) {
  assertConfigured()
  const key = makeKey(folder, originalName, mimeType)
  const contentType = mimeType || 'image/jpeg'
  await s3Client.send(
    new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Cache media aggressively; S3 URLs are immutable (unique keys).
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )
  const url = s3Config.getUrl(key)
  const proxy = s3Config.getProxyUrl(key)
  return {
    publicId: key, // S3 object key (kept in the existing `publicId` field)
    secureUrl: proxy || url,
    url: proxy || url,
    width: null,
    height: null,
    format: path.extname(key).replace('.', '') || 'jpg',
    bytes: buffer.byteLength,
    resourceType: 'image',
  }
}

export async function uploadFile(file, { folder, originalName, mimeType } = {}) {
  assertConfigured()
  const key = makeKey(folder, originalName || file?.originalname || '', mimeType || file?.mimetype || '')
  const contentType = mimeType || file?.mimetype || 'application/octet-stream'
  let body
  let bytes = null
  if (file?.buffer) {
    body = file.buffer
    bytes = file.buffer.byteLength
  } else if (file?.path) {
    const { createReadStream } = await import('node:fs')
    const { stat } = await import('node:fs/promises')
    try {
      const s = await stat(file.path)
      bytes = s.size
    } catch {}
    body = createReadStream(file.path)
  } else {
    throw new Error('No file buffer or path provided')
  }
  await s3Client.send(
    new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )
  const url = s3Config.getUrl(key)
  const proxy = s3Config.getProxyUrl(key)
  return {
    publicId: key,
    secureUrl: proxy || url,
    url: proxy || url,
    width: null,
    height: null,
    format: path.extname(key).replace('.', '') || 'jpg',
    bytes,
    resourceType: mimeType?.startsWith('video/') || file?.mimetype?.startsWith('video/') ? 'video' : 'image',
  }
}

// Delete an S3 object. Only keys under the app prefix are allowed.
export async function destroy(key) {
  assertConfigured()
  assertSafeKey(key)
  await s3Client.send(new DeleteObjectCommand({ Bucket: s3Config.bucket, Key: key }))
  return { result: 'ok' }
}

// Check whether an object exists (used to verify stored records still resolve).
export async function exists(key) {
  assertConfigured()
  assertSafeKey(key)
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: s3Config.bucket, Key: key }))
    return true
  } catch {
    return false
  }
}

// Delivery URL helper — S3 keys have no on-the-fly transformations, so the URL
// is simply the public object URL. Kept for abstraction parity.
export function deliveryUrl(key) {
  return key ? s3Config.getUrl(key) : ''
}

// Proxy URL that streams through the backend (`GET /api/media/<key>`).
// Use this for clean prefixes (`destinations/`, `vibe-videos/`, etc.) that are
// not yet public via bucket policy — the browser fetches via the API instead
// of direct S3, so 403 disappears without changing folder mappings.
export function proxyUrl(key) {
  return key ? s3Config.getProxyUrl(key) : ''
}

export function srcSet(key) {
  // S3 has no built-in image transformations; no responsive srcSet is generated.
  return undefined
}

export function isAllowedLogoMime(mime) {
  return ALLOWED_LOGO_MIME_TYPES.includes(mime)
}