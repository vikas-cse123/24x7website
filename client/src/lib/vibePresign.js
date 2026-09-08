// Shared presign cache for Vibe videos — lazy, per-key, heavily cached for session.
// Bucket stays private; Node only signs, browser fetches S3 directly (supports Range 206).
// Fallback to /api/media proxy only when presign fails — no broken/black video, no spinner.

import { vibePresignEndpoint } from '@/lib/vibeVideos'

const cache = new Map() // key -> presigned url
const inflight = new Map() // key -> Promise<string>

export function getCachedVibeUrl(key) {
  return cache.get(key) || null
}

export function setCachedVibeUrl(key, url) {
  if (key && url) cache.set(key, url)
}

export async function fetchVibePresignedUrl(key, fallbackUrl) {
  if (!key) return fallbackUrl || null
  const cached = cache.get(key)
  if (cached) return cached
  const ongoing = inflight.get(key)
  if (ongoing) return ongoing

  const promise = fetch(vibePresignEndpoint(key), { headers: { Accept: 'application/json' } })
    .then((res) => {
      if (!res.ok) throw new Error(`presign-vibe ${res.status}`)
      return res.json()
    })
    .then((data) => {
      if (data && typeof data.url === 'string' && data.url.length > 0) {
        cache.set(key, data.url)
        return data.url
      }
      throw new Error('no url')
    })
    .catch(() => {
      // Fallback only on failure — keeps video playable via proxy
      const fb = fallbackUrl || `/api/media/${key}`
      // Cache fallback as well to avoid repeated failing fetches
      cache.set(key, fb)
      return fb
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, promise)
  return promise
}

// Prefetch helper — fire-and-forget, used when card near visible
export function prefetchVibePresignedUrl(key, fallbackUrl) {
  if (cache.has(key) || inflight.has(key)) return
  void fetchVibePresignedUrl(key, fallbackUrl)
}
