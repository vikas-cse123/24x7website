import * as React from 'react'
import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/container'
import { Volume2, VolumeX, X, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock'

// "Vibe with Us" — horizontal strip of muted, autoplaying traveller videos,
// shown directly below "Book with Confidence". Order follows the numbered
// files in the S3 media store (video-1..video-8). Mouse users drag the strip
// (hold + move horizontally); touch devices scroll natively. Each video has
// its own mute/unmute toggle. Clicking a video opens the story-style
// lightbox player (mute, share, tour-package CTA) like the reference design.
// S3 bucket remains private — Node only signs (GET /api/media/presign-vibe), browser fetches S3 directly (Range 206).
// Lazy: presign only when card near visible or lightbox opened; no spinner, no layout shift, fallback to /api/media proxy.
import { VIDEOS, vibeKeyForIndex, vibeFallbackForIndex } from '@/lib/vibeVideos'
import { fetchVibePresignedUrl, getCachedVibeUrl } from '@/lib/vibePresign'

// Per-video tour CTA shown at the bottom of the lightbox. Edit titles,
// prices and destination slugs here (link goes to /trips?destination=<slug>).
const TOURS = [
  { title: 'Spiti tour packages', price: '₹16999/-', destination: 'spiti' },
  { title: 'Bali tour packages', price: '₹49999/-', destination: 'bali' },
  { title: 'Ladakh tour packages', price: '₹25999/-', destination: 'ladakh' },
  { title: 'Cambodia tour packages', price: '₹44999/-', destination: 'cambodia' },
  { title: 'Kerala tour packages', price: '₹18999/-', destination: 'kerala' },
  { title: 'Rajasthan tour packages', price: '₹21999/-', destination: 'rajasthan' },
  { title: 'Vietnam tour packages', price: '₹39999/-', destination: 'vietnam' },
  { title: 'Georgia tour packages', price: '₹54999/-', destination: 'georgia' },
]

export function VibeWithUs() {
  const sectionRef = React.useRef(null)
  const trackRef = React.useRef(null)
  const videoRefs = React.useRef([])
  const cardRefs = React.useRef([])
  const dragRef = React.useRef(null)
  const hasDraggedRef = React.useRef(false)
  const [dragging, setDragging] = React.useState(false)
  const [muted, setMuted] = React.useState(() => VIDEOS.map(() => true))
  const [visible, setVisible] = React.useState(false)
  // Lazy presigned S3 URLs per index — null = not yet fetched; string = presigned or fallback (only on failure)
  const [vibeSrcs, setVibeSrcs] = React.useState(() => VIDEOS.map(() => null))

  const ensureVibeSrc = React.useCallback((i) => {
    if (i == null || i < 0 || i >= VIDEOS.length) return
    const key = vibeKeyForIndex(i)
    const fallback = vibeFallbackForIndex(i)
    const cached = getCachedVibeUrl(key)
    if (cached) {
      setVibeSrcs((prev) => {
        if (prev[i]) return prev
        const next = [...prev]
        next[i] = cached
        return next
      })
      return
    }
    void fetchVibePresignedUrl(key, fallback).then((url) => {
      setVibeSrcs((prev) => {
        if (prev[i]) return prev
        const next = [...prev]
        next[i] = url
        return next
      })
    })
  }, [])

  React.useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting
        setVisible(isVisible)
      },
      { rootMargin: '200px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Lazy presign: fetch only when card near visible (existing carousel visibility mechanism extended)
  React.useEffect(() => {
    const root = trackRef.current
    if (!root || cardRefs.current.length === 0) return undefined
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.vibeIndex)
            if (!Number.isNaN(idx)) {
              ensureVibeSrc(idx)
              io.unobserve(entry.target)
            }
          }
        })
      },
      { root, rootMargin: '300px' }
    )
    cardRefs.current.forEach((el) => {
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [ensureVibeSrc])

  React.useEffect(() => {
    videoRefs.current.forEach((v, idx) => {
      if (!v) return
      if (!vibeSrcs[idx]) return
      if (visible) {
        const p = v.play()
        if (p && typeof p.catch === 'function') p.catch(() => {})
      } else {
        v.pause()
      }
    })
  }, [visible, vibeSrcs])

  // Also attempt play when a newly presigned src becomes available while visible
  React.useEffect(() => {
    if (!visible) return
    vibeSrcs.forEach((src, idx) => {
      if (!src) return
      const v = videoRefs.current[idx]
      if (v && v.paused) {
        const p = v.play()
        if (p && typeof p.catch === 'function') p.catch(() => {})
      }
    })
  }, [vibeSrcs, visible])

  // Lightbox state: index of the open video (null = closed) + its mute state
  const [active, setActive] = React.useState(null)
  const [lbMuted, setLbMuted] = React.useState(false)
  const [shareLabel, setShareLabel] = React.useState(false)
  const lightboxRef = React.useRef(null)
  const lbVideoRef = React.useRef(null)

  const startYRef = React.useRef(0)
  const lockRef = React.useRef(null)

  function onPointerDown(e) {
    if (e.button !== 0) return
    hasDraggedRef.current = false
    lockRef.current = null
    startYRef.current = e.clientY
    dragRef.current = { startX: e.clientX, startScrollLeft: trackRef.current.scrollLeft }
    // Don't capture yet — wait for horizontal lock
  }

  function onPointerMove(e) {
    if (!dragRef.current) return
    const walkX = e.clientX - dragRef.current.startX
    const walkY = e.clientY - startYRef.current
    if (!lockRef.current) {
      if (Math.abs(walkX) < 6 && Math.abs(walkY) < 6) return
      lockRef.current = Math.abs(walkX) > Math.abs(walkY) ? 'h' : 'v'
      if (lockRef.current === 'h') {
        setDragging(true)
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
      } else {
        return
      }
    }
    if (lockRef.current === 'v') return
    if (e.cancelable) e.preventDefault()
    if (Math.abs(walkX) > 10) hasDraggedRef.current = true
    trackRef.current.scrollLeft = dragRef.current.startScrollLeft - walkX
  }

  function onPointerUp(e) {
    dragRef.current = null
    lockRef.current = null
    setDragging(false)
    try {
      e.currentTarget?.releasePointerCapture?.(e.pointerId)
    } catch {}
    if (hasDraggedRef.current) {
      setTimeout(() => {
        hasDraggedRef.current = false
      }, 0)
    }
  }

  function toggleMute(i) {
    const video = videoRefs.current[i]
    if (!video) return
    video.muted = !video.muted
    setMuted((prev) => prev.map((value, j) => (j === i ? video.muted : value)))
  }

  function openLightbox(i) {
    ensureVibeSrc(i)
    setActive(i)
    setLbMuted(false)
    setShareLabel(false)
  }

  function closeLightbox() {
    setActive(null)
  }

  function stepLightbox(dir) {
    setActive((prev) => {
      if (prev == null) return prev
      const next = (prev + dir + VIDEOS.length) % VIDEOS.length
      ensureVibeSrc(next)
      return next
    })
    setLbMuted(false)
    setShareLabel(false)
  }

  // Ensure lightbox video has presigned src when active changes
  React.useEffect(() => {
    if (active != null) ensureVibeSrc(active)
  }, [active, ensureVibeSrc])

  async function shareActive() {
    if (active == null) return
    const url = window.location.origin + window.location.pathname
    try {
      if (navigator.share) {
        await navigator.share({ title: '24x7Chhutti — Vibe with Us', url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareLabel(true)
        setTimeout(() => setShareLabel(false), 1500)
      }
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  }

  // Click on the dimmed sides navigates (left = prev, right = next),
  // matching the reference where the neighbouring videos peek through.
  function onBackdropClick(e) {
    const rect = lightboxRef.current?.getBoundingClientRect()
    if (!rect) return
    stepLightbox(e.clientX < rect.left + rect.width / 2 ? -1 : 1)
  }

  // Keyboard controls + body scroll lock while the lightbox is open
  React.useEffect(() => {
    if (active == null) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox()
      else if (e.key === 'ArrowRight') stepLightbox(1)
      else if (e.key === 'ArrowLeft') stepLightbox(-1)
    }
    window.addEventListener('keydown', onKey)
    lockBodyScroll()
    lightboxRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      unlockBodyScroll()
    }
  }, [active])

  // React ignores `muted` prop changes after mount — control it imperatively
  React.useEffect(() => {
    const video = lbVideoRef.current
    if (!video) return
    video.muted = lbMuted
    video.play().catch(() => {})
  }, [lbMuted, active])

  // Lightbox src — presigned if available, fallback only if presign failed (cached fallback)
  const lbSrc = active != null ? vibeSrcs[active] || null : null
  // Effect: when lbSrc becomes available, play lightbox video
  React.useEffect(() => {
    if (active == null || !lbSrc) return
    const v = lbVideoRef.current
    if (v) v.play().catch(() => {})
  }, [lbSrc, active])

  const circleBtn =
    'grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'

  return (
    <section ref={sectionRef} aria-label="Vibe with Us — traveller videos" className="bg-background py-10 lg:py-12">
      <Container className="max-w-none mx-0 w-full px-5 sm:px-6 lg:px-[90px]">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Vibe with Us
        </h2>
      </Container>

      <div
        ref={trackRef}
        role="region"
        aria-label="Traveller videos"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          if (hasDraggedRef.current) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        className={cn(
          'mt-8 flex gap-12 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:px-6 lg:px-[90px] [&::-webkit-scrollbar]:hidden overscroll-x-contain touch-pan-y scroll-smooth',
          dragging ? 'cursor-grabbing select-none' : 'cursor-grab'
        )}
      >
        {VIDEOS.map((src, i) => (
          <div
            key={src}
            ref={(el) => (cardRefs.current[i] = el)}
            data-vibe-index={i}
            className="relative h-[550px] w-[320px] shrink-0 overflow-hidden rounded-xl"
            style={{ width: '320px', height: '550px', flex: '0 0 320px' }}
          >
            <button
              type="button"
              onClick={() => {
                if (hasDraggedRef.current) return
                openLightbox(i)
              }}
              aria-label={`Play traveller video ${i + 1} in fullscreen`}
              className="block h-full w-full cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            >
              <video
                ref={(el) => (videoRefs.current[i] = el)}
                src={vibeSrcs[i] || undefined}
                autoPlay
                muted
                loop
                playsInline
                preload="none"
                draggable={false}
                tabIndex={-1}
                aria-hidden="true"
                className="pointer-events-none block h-full w-full object-cover"
                style={{ width: '320px', height: '550px', objectFit: 'cover' }}
              />
            </button>
            <button
              type="button"
              onClick={() => toggleMute(i)}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={muted[i] ? `Unmute video ${i + 1}` : `Mute video ${i + 1}`}
              className="absolute bottom-2.5 right-2.5 grid h-7 w-7 place-items-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {muted[i] ? (
                <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        ))}
      </div>

      {active != null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Traveller video ${active + 1} of ${VIDEOS.length}`}
          ref={lightboxRef}
          tabIndex={-1}
          onClick={onBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 focus-visible:outline-none sm:p-6"
        >
          {/* Story-style portrait player */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative aspect-[9/16] h-[94vh] max-w-[94vw] overflow-hidden rounded-2xl bg-black shadow-2xl"
          >
            <video
              key={lbSrc || `lb-${active}`}
              ref={lbVideoRef}
              src={lbSrc || undefined}
              autoPlay
              loop
              playsInline
              muted={false}
              preload="auto"
              className="block h-full w-full object-cover"
              aria-label={`Traveller video ${active + 1} of ${VIDEOS.length}`}
            />

            {/* Mute toggle (top-left) */}
            <button
              type="button"
              onClick={() => setLbMuted((v) => !v)}
              aria-label={lbMuted ? 'Unmute video' : 'Mute video'}
              className={cn(circleBtn, 'absolute left-3 top-3')}
            >
              {lbMuted ? <VolumeX className="h-[18px] w-[18px]" aria-hidden="true" /> : <Volume2 className="h-[18px] w-[18px]" aria-hidden="true" />}
            </button>

            {/* Close (top-right) */}
            <button
              type="button"
              onClick={closeLightbox}
              aria-label="Close video player"
              className={cn(circleBtn, 'absolute right-3 top-3')}
            >
              <X className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>

            {/* Share (right edge, lower half) */}
            <button
              type="button"
              onClick={shareActive}
              aria-label="Share video"
              className="absolute bottom-[22%] right-3 flex flex-col items-center gap-1 text-white drop-shadow transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {shareLabel ? (
                <span className="max-w-[70px] text-center text-[11px] font-medium leading-tight">Link copied</span>
              ) : (
                <>
                  <Send className="h-5 w-5" aria-hidden="true" />
                  <span className="text-[11px] font-medium">Share</span>
                </>
              )}
            </button>

            {/* Tour-package CTA (bottom) */}
            <Link
              to={`/trips?destination=${TOURS[active % TOURS.length].destination}`}
              className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-xl bg-black/55 p-2 pr-3 backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-black/40">
                <video
                  src={lbSrc ? `${lbSrc}#t=0.2` : undefined}
                  muted
                  playsInline
                  preload="metadata"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">
                  {TOURS[active % TOURS.length].title}
                </span>
                <span className="block text-xs font-medium text-green-400">
                  Starting with {TOURS[active % TOURS.length].price} only
                </span>
              </span>
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
