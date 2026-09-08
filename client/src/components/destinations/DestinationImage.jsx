import * as React from 'react'
import { cn } from '@/lib/utils'
import { resolveImageSrc, resolveSrcSet } from '@/lib/media'
import { BrandLogoImage } from '@/components/brand/BrandLogoImage'
import { extractImageKey, getCachedImageUrl, fetchPresignedImageUrl } from '@/lib/imagePresign'

// Image can be a string URL (legacy) or an image object {url, secureUrl, publicId, alt}
// Delivery: private bucket, Node only signs (GET /api/media/presign-image), browser → S3 direct.
// Lazy: presign only when near visible (200px) unless eager/high priority; fallback to /api/media proxy only on failure.
export function DestinationImage({ src, alt = '', image, className, imgClassName, width, loading = 'lazy', fetchPriority }) {
  const [errored, setErrored] = React.useState(false)
  const imgObj = image || (typeof src === 'string' ? { url: src, alt } : src ? { ...src, alt: src.alt || alt } : null)
  const fallbackSrc = resolveImageSrc(imgObj, { w: width || 800 }) || (typeof src === 'string' ? src : '')
  const s3Key = extractImageKey(imgObj || fallbackSrc)
  const isS3Image = Boolean(s3Key)
  const isEager = loading === 'eager' || fetchPriority === 'high'
  const containerRef = React.useRef(null)
  const [shouldFetch, setShouldFetch] = React.useState(() => {
    if (!isS3Image) return false
    if (isEager) return true
    // If already cached (presigned or fallback), we can fetch/render immediately when near
    // but still defer until observer fires to avoid homepage N presigns
    return false
  })
  const [presignedSrc, setPresignedSrc] = React.useState(() => {
    if (!isS3Image) return null
    const cached = getCachedImageUrl(s3Key)
    if (cached) return cached
    return null
  })

  // If s3Key changes, reset presigned state to cached or null and reset shouldFetch for eager
  React.useEffect(() => {
    if (!isS3Image) {
      setPresignedSrc(null)
      setShouldFetch(false)
      return
    }
    const cached = getCachedImageUrl(s3Key)
    if (cached) {
      setPresignedSrc(cached)
      // Cached means we already have URL, no need to wait for observer — render immediately
      setShouldFetch(true)
    } else {
      setPresignedSrc(null)
      setShouldFetch(isEager)
    }
  }, [s3Key, isS3Image, isEager])

  // Lazy: fetch presign only when near visible
  React.useEffect(() => {
    if (!isS3Image) return undefined
    if (shouldFetch) return undefined
    if (isEager) return undefined
    const el = containerRef.current
    if (!el) return undefined
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldFetch(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [isS3Image, shouldFetch, isEager])

  // Fetch presigned URL when shouldFetch becomes true
  React.useEffect(() => {
    if (!isS3Image || !shouldFetch) return undefined
    if (presignedSrc) return undefined
    let cancelled = false
    const fallback = typeof fallbackSrc === 'string' && fallbackSrc.startsWith('/api/media/') ? fallbackSrc : `/api/media/${s3Key}`
    void fetchPresignedImageUrl(s3Key, fallback).then((url) => {
      if (!cancelled) setPresignedSrc(url)
    })
    return () => {
      cancelled = true
    }
  }, [isS3Image, shouldFetch, s3Key, fallbackSrc, presignedSrc])

  // Decide final src to render
  let finalSrc = ''
  let finalLoading = loading
  if (!isS3Image) {
    finalSrc = fallbackSrc
  } else if (presignedSrc) {
    finalSrc = presignedSrc
  } else if (!shouldFetch) {
    // Not yet near visible — don't render img yet (preserve lazy, avoid N presigns)
    finalSrc = ''
  } else {
    // Fetching presign (eager or now near visible) — keep empty until presigned resolves
    // Fallback will be set via presignedSrc when fetch fails (cached fallback)
    finalSrc = ''
  }

  const srcSet = resolveSrcSet(imgObj)
  // isS3Image && !finalSrc => still pending, show placeholder (no layout shift — container keeps className dimensions)
  const showImage = Boolean((finalSrc || (!isS3Image && fallbackSrc)) && !errored)
  const renderSrc = finalSrc || (!isS3Image ? fallbackSrc : '')

  return (
    <div ref={containerRef} className={cn('flex items-center justify-center overflow-hidden bg-muted', className)}>
      {showImage && renderSrc ? (
        <img
          src={renderSrc}
          srcSet={srcSet}
          sizes={width ? `${width}px` : "(max-width: 640px) 100vw, 50vw"}
          alt={alt || imgObj?.alt || ''}
          loading={finalLoading}
          fetchPriority={fetchPriority}
          onError={() => setErrored(true)}
          className={cn('h-full w-full object-cover', imgClassName)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-muted to-muted">
          <BrandLogoImage imgClassName="h-10 w-auto opacity-40" />
        </div>
      )}
    </div>
  )
}
