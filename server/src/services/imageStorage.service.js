// Storage abstraction — AWS S3 is the current provider.
// Callers use imageStorage.upload / remove / replace and never touch S3
// directly. Swap the provider by changing this module's internals.
import mongoose from 'mongoose'
import * as s3Service from './s3.service.js'
import { LEGACY_KEY_PREFIX, KEY_PREFIXES, isAppKey } from '../utils/imageFolders.js'

export async function upload(buffer, opts) {
  return s3Service.uploadBuffer(buffer, opts)
}
export async function uploadFile(file, opts) {
  return s3Service.uploadFile(file, opts)
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

// Targeted reference checks — replace full collection scans.
// Only models that actually store media are queried, via indexed field paths.
// Fail-closed: any DB error treats key as referenced.
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function checkModelsForKeys(keys) {
  const uniq = [...new Set(keys.filter(Boolean))]
  if (!uniq.length) return new Map()
  const result = new Map(uniq.map((k) => [k, false]))
  const combinedPattern = uniq.map(escapeRegex).join('|')
  const urlRegex = combinedPattern ? new RegExp(combinedPattern) : null
  // Lazy import models to avoid circular init issues
  let Trip, Destination, Blog, TripMedia, AppSetting
  try {
    Trip = mongoose.model('Trip')
    Destination = mongoose.model('Destination')
    Blog = mongoose.model('Blog')
    TripMedia = mongoose.model('TripMedia')
    AppSetting = mongoose.model('AppSetting')
  } catch {
    // If models not registered yet, fail closed
    uniq.forEach((k) => result.set(k, true))
    return result
  }

  const checks = []

  // Trip: heroImage/cardImage/heroVideo + reviews[].image + url variants
  checks.push(
    (async () => {
      try {
        const or = [
          { 'heroImage.publicId': { $in: uniq } },
          { 'cardImage.publicId': { $in: uniq } },
          { 'heroVideo.publicId': { $in: uniq } },
          { 'reviews.image.publicId': { $in: uniq } },
        ]
        if (urlRegex) {
          or.push({ 'heroImage.url': { $regex: urlRegex } })
          or.push({ 'heroImage.secureUrl': { $regex: urlRegex } })
          or.push({ 'cardImage.url': { $regex: urlRegex } })
          or.push({ 'cardImage.secureUrl': { $regex: urlRegex } })
          or.push({ 'heroVideo.url': { $regex: urlRegex } })
          or.push({ 'heroVideo.secureUrl': { $regex: urlRegex } })
        }
        const docs = await Trip.find({ $or: or }).lean()
        for (const d of docs) for (const k of collectKeys(d)) if (result.has(k)) result.set(k, true)
      } catch { uniq.forEach((k) => result.set(k, true)) }
    })()
  )

  // Destination: homepageImage/heroImage/heroVideo/gallery
  checks.push(
    (async () => {
      try {
        const or = [
          { 'homepageImage.publicId': { $in: uniq } },
          { 'heroImage.publicId': { $in: uniq } },
          { 'heroVideo.publicId': { $in: uniq } },
          { 'gallery.publicId': { $in: uniq } },
        ]
        if (urlRegex) {
          or.push({ 'homepageImage.url': { $regex: urlRegex } })
          or.push({ 'homepageImage.secureUrl': { $regex: urlRegex } })
          or.push({ 'heroImage.url': { $regex: urlRegex } })
          or.push({ 'heroImage.secureUrl': { $regex: urlRegex } })
          or.push({ 'heroVideo.url': { $regex: urlRegex } })
          or.push({ 'heroVideo.secureUrl': { $regex: urlRegex } })
        }
        const docs = await Destination.find({ $or: or }).lean()
        for (const d of docs) for (const k of collectKeys(d)) if (result.has(k)) result.set(k, true)
      } catch { uniq.forEach((k) => result.set(k, true)) }
    })()
  )

  // Blog: coverImage + content image blocks (url)
  checks.push(
    (async () => {
      try {
        const or = [
          { 'coverImage.publicId': { $in: uniq } },
          { 'content.url': { $in: uniq } },
        ]
        if (urlRegex) {
          or.push({ 'coverImage.url': { $regex: urlRegex } })
          or.push({ 'coverImage.secureUrl': { $regex: urlRegex } })
          or.push({ 'content.url': { $regex: urlRegex } })
          or.push({ 'content.caption': { $regex: urlRegex } })
        }
        const docs = await Blog.find({ $or: or }).lean()
        for (const d of docs) for (const k of collectKeys(d)) if (result.has(k)) result.set(k, true)
      } catch { uniq.forEach((k) => result.set(k, true)) }
    })()
  )

  // TripMedia: publicId + url
  checks.push(
    (async () => {
      try {
        const or = [{ publicId: { $in: uniq } }]
        if (urlRegex) {
          or.push({ url: { $regex: urlRegex } })
          or.push({ secureUrl: { $regex: urlRegex } })
        }
        const docs = await TripMedia.find({ $or: or }).lean()
        for (const d of docs) for (const k of collectKeys(d)) if (result.has(k)) result.set(k, true)
      } catch { uniq.forEach((k) => result.set(k, true)) }
    })()
  )

  // AppSetting (Mixed data) — small collection, fetch all and check via collectKeys
  checks.push(
    (async () => {
      try {
        const docs = await AppSetting.find({}).lean()
        for (const d of docs) for (const k of collectKeys(d.data)) if (result.has(k)) result.set(k, true)
        // also check if data directly contains key via regex pattern in case of nested
        if (urlRegex) {
          for (const d of docs) {
            const str = JSON.stringify(d.data || {})
            for (const k of uniq) if (!result.get(k) && str.includes(k)) result.set(k, true)
          }
        }
      } catch { uniq.forEach((k) => result.set(k, true)) }
    })()
  )

  await Promise.all(checks)
  return result
}

export async function isKeyReferenced(key) {
  const m = await checkModelsForKeys([key])
  return m.get(key) ?? true
}

export async function areKeysReferenced(keys) {
  const uniq = [...new Set(keys.filter(Boolean))]
  const result = new Map(uniq.map((k) => [k, false]))
  if (!uniq.length) return result
  const map = await checkModelsForKeys(uniq)
  for (const k of uniq) result.set(k, map.get(k) ?? true)
  return result
}

// Reference-aware cleanup of S3 objects that are no longer part of an entity.
// For every candidate key:
//   1. check references across the whole database
//   2. delete the object ONLY when no document references it
//   3. never throw — S3 state must not break the (already successful) DB state
// `label` identifies the calling operation in server logs.
// Optimised: checks all candidate keys in a single DB scan via areKeysReferenced.
export async function cleanupUnreferenced(objectKeys, label = '') {
  const keys = (Array.isArray(objectKeys) ? objectKeys : [objectKeys]).filter(Boolean)
  const result = { deleted: [], skipped: [], failed: [] }
  if (!keys.length) return result

  console.log(
    `[Media Cleanup] ${label}: ${keys.length} removed media candidate(s)`
  )
  let referencedMap
  try {
    referencedMap = await areKeysReferenced(keys)
  } catch {
    // If batch check fails, fail closed – treat all as referenced
    for (const k of keys) {
      console.log(`[Media Cleanup] Object still referenced elsewhere: skipping ${k}`)
      result.skipped.push(k)
    }
    return result
  }
  const toDelete = keys.filter((k) => !referencedMap.get(k))
  const skippedKeys = keys.filter((k) => referencedMap.get(k))
  for (const k of skippedKeys) {
    console.log(`[Media Cleanup] Object still referenced elsewhere: skipping ${k}`)
    result.skipped.push(k)
  }
  // Bounded concurrency deletes (~5 at a time)
  const CONCURRENCY = 5
  for (let i = 0; i < toDelete.length; i += CONCURRENCY) {
    const chunk = toDelete.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      chunk.map(async (key) => {
        await s3Service.destroy(key)
        return key
      })
    )
    results.forEach((r, idx) => {
      const key = chunk[idx]
      if (r.status === 'fulfilled') {
        console.log(`[Media Cleanup] Deleted unused S3 object: ${key}`)
        result.deleted.push(key)
      } else {
        console.error(`[Media Cleanup] Failed to delete S3 object: ${key} — ${r.reason?.message || r.reason}`)
        result.failed.push(key)
      }
    })
  }
  return result
}