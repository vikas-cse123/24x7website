// Storage abstraction — AWS S3 is the current provider.
// Callers use imageStorage.upload / remove / replace and never touch S3
// directly. Swap the provider by changing this module's internals.
import mongoose from 'mongoose'
import * as s3Service from './s3.service.js'
import { LEGACY_KEY_PREFIX, KEY_PREFIXES, isAppKey } from '../utils/imageFolders.js'

export async function upload(buffer, opts) {
  return s3Service.uploadBuffer(buffer, opts)
}

export async function remove(objectKey) {
  return s3Service.destroy(objectKey)
}

export async function replace(objectKey, buffer, opts) {
  // S3 replace = delete old + upload new.
  if (objectKey) await s3Service.destroy(objectKey).catch(() => {})
  return s3Service.uploadBuffer(buffer, opts)
}

export function getUrl(objectKey) {
  return s3Service.deliveryUrl(objectKey)
}

// Proxy URL that streams via backend — use for clean prefixes that are not
// public via bucket policy. Keeps folder mappings identical; only delivery
// changes. Client fetches `/api/media/<key>` which the server proxies from S3.
export function getProxyUrl(objectKey) {
  return s3Service.proxyUrl(objectKey)
}

export function getSrcSet() {
  return s3Service.srcSet()
}

// Rewrite a stored image object's delivery URLs to the proxy so the browser
// never hits S3 directly for private clean-prefix objects. Legacy
// `travel-crm/*` URLs remain fetchable via proxy as well, so switching to
// proxy is safe even when bucket policy later allows direct S3 GET.
export function withProxyUrl(image) {
  if (!image || typeof image !== 'object') return image
  const key = image.publicId
  if (!key || !isAppKey(key)) return image
  const proxy = s3Service.proxyUrl(key)
  return { ...image, url: proxy, secureUrl: proxy }
}

export function withProxyUrls(images) {
  if (!Array.isArray(images)) return images
  return images.map((img) => withProxyUrl(img))
}

// Collect S3 object keys from an arbitrary document tree — handles
// heroImage/gallery/coverImage sub-documents, arrays of them, top-level
// TripMedia-style records, AND keys/URLs embedded inside plain strings
// (e.g. blog content image blocks that store only a URL).
// Also accepts an array/set of already-collected key strings (identity) so
// callers can pass either form.
// Understands BOTH legacy `travel-crm/...` keys (existing records still
// reference them) and the new clean-prefix keys — never prefix-dependent.
// The extraction regex requires a file extension so route-like paths
// (`/destinations/vietnam`) are never mistaken for object keys.
const PREFIX_SOURCES = [LEGACY_KEY_PREFIX.replace(/\/$/, ''), ...KEY_PREFIXES]
const KEY_SOURCE = `(?:${PREFIX_SOURCES.join('|')})/[A-Za-z0-9._\\-/]+\\.[A-Za-z0-9]{1,8}`
const KEY_PATTERN = new RegExp(KEY_SOURCE, 'g') // for matchAll extraction
const KEY_TEST = new RegExp(KEY_SOURCE) // non-global for .test() (no lastIndex state)

export function collectKeys(value) {
  const keys = new Set()
  const visit = (node) => {
    if (!node) return
    if (typeof node === 'string') {
      if (isAppKey(node)) {
        keys.add(node)
      } else if (KEY_TEST.test(node)) {
        // Extract keys embedded in larger strings (e.g. full URLs or HTML)
        for (const match of node.matchAll(KEY_PATTERN)) keys.add(match[0])
      }
      return
    }
    if (typeof node !== 'object') return
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (isAppKey(node.publicId)) {
      keys.add(node.publicId)
    }
    for (const v of Object.values(node)) {
      if (v && (typeof v === 'object' || typeof v === 'string')) visit(v)
    }
  }
  visit(value)
  return [...keys]
}

// Keys present in `before` but gone from `after` — used to detect images
// removed/replaced during an entity update.
export function removedKeys(before, after) {
  const afterSet = new Set(collectKeys(after))
  return collectKeys(before).filter((key) => !afterSet.has(key))
}

// Delete several S3 objects. Best-effort: failures are swallowed so that a
// storage hiccup never blocks the business operation (e.g. entity deletion);
// the database change is the source of truth.
export async function removeMany(objectKeys) {
  const keys = (Array.isArray(objectKeys) ? objectKeys : [objectKeys]).filter(Boolean)
  if (!keys.length) return { attempted: 0, failed: 0 }
  const results = await Promise.allSettled(keys.map((key) => s3Service.destroy(key)))
  return {
    attempted: keys.length,
    failed: results.filter((r) => r.status === 'rejected').length,
  }
}

// Check whether ANY document across ALL MongoDB collections references the
// given S3 key (directly as `publicId` or inside a URL string). This is the
// reference-aware safety check run before any S3 object is deleted: the same
// upload may be reused by a destination, trip, blog, trip-media record, etc.
//
// Uses a generic $where scan so nested/renamed fields are covered without
// maintaining a per-model path registry. Collections are small (admin content)
// and this only runs for the handful of keys actually removed in a save, with
// an early exit on the first referencing document.
// Conservative on failure: if the DB cannot be consulted, the key is treated
// as referenced (deletion skipped) rather than risking broken media.
export async function isKeyReferenced(key) {
  const db = mongoose.connection?.db
  if (!db) return true
  const matchExpr = `JSON.stringify(this).indexOf(${JSON.stringify(key)}) !== -1`
  let collections
  try {
    collections = await db.collections()
  } catch {
    return true
  }
  for (const collection of collections) {
    try {
      const found = await collection.find({ $where: matchExpr }).limit(1).toArray()
      if (found.length) return true
    } catch {
      // If a collection cannot be scanned, assume it may reference the key.
      return true
    }
  }
  return false
}

// Reference-aware cleanup of S3 objects that are no longer part of an entity.
// For every candidate key:
//   1. check references across the whole database
//   2. delete the object ONLY when no document references it
//   3. never throw — S3 state must not break the (already successful) DB state
// `label` identifies the calling operation in server logs.
export async function cleanupUnreferenced(objectKeys, label = '') {
  const keys = (Array.isArray(objectKeys) ? objectKeys : [objectKeys]).filter(Boolean)
  const result = { deleted: [], skipped: [], failed: [] }
  if (!keys.length) return result

  console.log(
    `[Media Cleanup] ${label}: ${keys.length} removed media candidate(s)`
  )
  for (const key of keys) {
    try {
      const referenced = await isKeyReferenced(key)
      if (referenced) {
        console.log(
          `[Media Cleanup] Object still referenced elsewhere: skipping ${key}`
        )
        result.skipped.push(key)
        continue
      }
      await s3Service.destroy(key)
      console.log(`[Media Cleanup] Deleted unused S3 object: ${key}`)
      result.deleted.push(key)
    } catch (err) {
      // Missing object / network error / permissions — log and move on; the
      // DB update stays valid. (S3 DeleteObject is idempotent, so a key that
      // was already gone resolves here as a normal deletion.)
      console.error(`[Media Cleanup] Failed to delete S3 object: ${key} — ${err?.message || err}`)
      result.failed.push(key)
    }
  }
  return result
}