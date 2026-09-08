// Shared presign cache for S3 images — lazy, per-key, heavily cached for session.
// Bucket stays private; Node only signs, browser fetches S3 directly.
// Fallback to /api/media proxy only when presign fails — no broken image, no spinner.
// Reuses vibe presign patterns: Map cache + in-flight dedup, 1h expiry.

const IMAGE_EXT_RE = /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i
const CACHE_TTL_MS = 55 * 60 * 1000 // 55min (presigned expires in 60min, refresh early)

// key -> { url, expiresAt }
const cache = new Map()
// key -> Promise<string>
const inflight = new Map()

function isImageKey(key) {
  if (!key || typeof key !== 'string') return false
  if (key.includes('..') || key.includes('//') || key.includes('\\')) return false
  if (!IMAGE_EXT_RE.test(key)) return false
  // Must be app-managed prefix — replicate KEY_PREFIXES + legacy, but allow any that server would accept via isAppKey
  // Minimal client check: must contain '/' and not be external URL
  if (!key.includes('/')) return false
  if (/^https?:\/\//.test(key)) return false
  return true
}

export function getCachedImageUrl(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.url
}

export function setCachedImageUrl(key, url, ttlMs = CACHE_TTL_MS) {
  if (key && url) cache.set(key, { url, expiresAt: Date.now() + ttlMs })
}

export function imagePresignEndpoint(key) {
  return `/api/media/presign-image?key=${encodeURIComponent(key)}`
}

// Extract S3 key from various image input forms
export function extractImageKey(input) {
  if (!input) return null
  // Object form { publicId, url, secureUrl }
  if (typeof input === 'object') {
    if (input.publicId && typeof input.publicId === 'string' && !/^https?:\/\//.test(input.publicId)) {
      const k = input.publicId.split('?')[0].split('#')[0].trim()
      if (isImageKey(k)) return k
      // fallback to url
    }
    const url = input.url || input.secureUrl || ''
    return extractKeyFromUrl(url)
  }
  // String form
  if (typeof input === 'string') {
    return extractKeyFromUrl(input)
  }
  return null
}

export function extractKeyFromUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return null
  const s = urlStr.trim()
  if (!s) return null
  if (s.startsWith('data:') || s.startsWith('blob:')) return null
  if (s.includes('X-Amz-') ) return null // already presigned
  // /api/media/<key>
  const apiIdx = s.indexOf('/api/media/')
  if (apiIdx !== -1) {
    const after = s.slice(apiIdx + '/api/media/'.length).split('?')[0].split('#')[0]
    const decoded = safeDecode(after)
    if (isImageKey(decoded)) return decoded
    // also allow if not strictly image but we still return to let server validate
    return decoded || null
  }
  // https://<bucket>.s3.<region>.amazonaws.com/<key>
  if (/^https?:\/\//.test(s)) {
    try {
      const u = new URL(s)
      if (u.hostname.includes('s3') && u.hostname.includes('amazonaws.com')) {
        const key = u.pathname.replace(/^\/+/, '').split('?')[0].split('#')[0]
        const decoded = safeDecode(key)
        if (isImageKey(decoded)) return decoded
        return decoded || null
      }
    } catch {}
    return null // external URL — do not presign
  }
  // Raw key like destinations/abc.jpg
  const raw = s.split('?')[0].split('#')[0]
  const decoded = safeDecode(raw)
  if (isImageKey(decoded)) return decoded
  return null
}

function safeDecode(v) {
  try { return decodeURIComponent(v) } catch { return v }
}

export async function fetchPresignedImageUrl(key, fallbackUrl) {
  if (!key || !isImageKey(key)) return fallbackUrl || null
  const cached = getCachedImageUrl(key)
  if (cached) return cached
  const ongoing = inflight.get(key)
  if (ongoing) return ongoing

  const promise = fetch(imagePresignEndpoint(key), { headers: { Accept: 'application/json' } })
    .then((res) => {
      if (!res.ok) throw new Error(`presign-image ${res.status}`)
      return res.json()
    })
    .then((data) => {
      if (data && typeof data.url === 'string' && data.url.length > 0) {
        const ttl = typeof data.expiresIn === 'number' ? (data.expiresIn * 1000 - 60_000) : CACHE_TTL_MS
        setCachedImageUrl(key, data.url, ttl)
        return data.url
      }
      throw new Error('no url')
    })
    .catch(() => {
      const fb = fallbackUrl || `/api/media/${key}`
      // Cache fallback briefly to avoid hammering failing endpoint (5min)
      setCachedImageUrl(key, fb, 5 * 60 * 1000)
      return fb
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, promise)
  return promise
}

export function prefetchPresignedImageUrl(key, fallbackUrl) {
  if (!key || !isImageKey(key)) return
  if (getCachedImageUrl(key) || inflight.has(key)) return
  void fetchPresignedImageUrl(key, fallbackUrl)
}
