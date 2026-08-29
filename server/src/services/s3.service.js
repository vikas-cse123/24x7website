import crypto from 'node:crypto'
import path from 'node:path'
import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { s3Client, isS3Configured, s3Config } from '../config/s3.js'

// Safety: the app may only ever touch objects under its own media prefix.
// Prevents an admin/delete request from removing arbitrary S3 objects.
const APP_PREFIX = 'travel-crm/'
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
  // Must be within the app prefix and must not contain path-traversal segments.
  if (!key.startsWith(APP_PREFIX) || /(^|\/)\.\.(\/|$)/.test(key)) {
    const err = new Error(`Forbidden: key must be within ${APP_PREFIX}`)
    err.status = 403
    throw err
  }
}

// Build a unique object key under the given folder, e.g.
// travel-crm/destinations/<id>/<timestamp>-<uuid>.jpg
// The original filename is never used directly as the key.
function makeKey(folder, originalName = '', mimeType = '') {
  const base = (folder || 'travel-crm/website').replace(/^\/+|\/+$/g, '').replace(/\/+$/g, '')
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
  return {
    publicId: key, // S3 object key (kept in the existing `publicId` field)
    secureUrl: url,
    url,
    width: null,
    height: null,
    format: path.extname(key).replace('.', '') || 'jpg',
    bytes: buffer.byteLength,
    resourceType: 'image',
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

export function srcSet(key) {
  // S3 has no built-in image transformations; no responsive srcSet is generated.
  return undefined
}

export function isAllowedLogoMime(mime) {
  return ALLOWED_LOGO_MIME_TYPES.includes(mime)
}