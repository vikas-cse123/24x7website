import * as React from 'react'
import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/container'
import { Volume2, VolumeX, X, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

// "Vibe with Us" — horizontal strip of muted, autoplaying traveller videos,
// shown directly below "Book with Confidence". Order follows the numbered
// files in the S3 media store (video-1..video-8). Mouse users drag the strip
// (hold + move horizontally); touch devices scroll natively. Each video has
// its own mute/unmute toggle. Clicking a video opens the story-style
// lightbox player (mute, share, tour-package CTA) like the reference design.
const VIDEO_BASE = '/api/media/vibe-videos'
const VIDEOS = Array.from({ length: 8 }, (_, i) => `${VIDEO_BASE}/video-${i + 1}.mp4`)

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
  const trackRef = React.useRef(null)
  const videoRefs = React.useRef([])
  const dragRef = React.useRef(null)
  const [dragging, setDragging] = React.useState(false)
  const [muted, setMuted] = React.useState(() => VIDEOS.map(() => true))

  // Lightbox state: index of the open video (null = closed) + its mute state
  const [active, setActive] = React.useState(null)
  const [lbMuted, setLbMuted] = React.useState(false)
  const [shareLabel, setShareLabel] = React.useState(false)
  const lightboxRef = React.useRef(null)
  const lbVideoRef = React.useRef(null)

  function onPointerDown(e) {
    // Touch devices scroll natively; mouse users get hold-and-drag.
    if (e.pointerType !== 'mouse') return
    dragRef.current = { startX: e.clientX, startScrollLeft: trackRef.current.scrollLeft }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e) {
    if (!dragRef.current) return
    trackRef.current.scrollLeft = dragRef.current.startScrollLeft - (e.clientX - dragRef.current.startX)
  }

  function onPointerUp() {
    dragRef.current = null
    setDragging(false)
  }

  function toggleMute(i) {
    const video = videoRefs.current[i]
    if (!video) return
    video.muted = !video.muted
    setMuted((prev) => prev.map((value, j) => (j === i ? video.muted : value)))
  }

  function openLightbox(i) {
    setActive(i)
    setLbMuted(false)
    setShareLabel(false)
  }

  function closeLightbox() {
    setActive(null)
  }

  function stepLightbox(dir) {
    setActive((prev) => (prev == null ? prev : (prev + dir + VIDEOS.length) % VIDEOS.length))
    setLbMuted(false)
    setShareLabel(false)
  }

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
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    lightboxRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [active])

  // React ignores `muted` prop changes after mount — control it imperatively
  React.useEffect(() => {
    const video = lbVideoRef.current
    if (!video) return
    video.muted = lbMuted
    video.play().catch(() => {})
  }, [lbMuted, active])

  const circleBtn =
    'grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'

  return (
    <section aria-label="Vibe with Us — traveller videos" className="bg-background py-10 lg:py-12">
      <Container>
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
        className={cn(
          'mt-8 flex select-none gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
      >
        {VIDEOS.map((src, i) => (
          <div
            key={src}
            className="relative w-[200px] shrink-0 overflow-hidden rounded-xl sm:w-[230px]"
          >
            <button
              type="button"
              onClick={() => openLightbox(i)}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={`Play traveller video ${i + 1} in fullscreen`}
              className="block w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <video
                ref={(el) => (videoRefs.current[i] = el)}
                src={src}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                draggable={false}
                tabIndex={-1}
                aria-hidden="true"
                className="pointer-events-none block aspect-[9/16] w-full object-cover"
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
              key={VIDEOS[active]}
              ref={lbVideoRef}
              src={VIDEOS[active]}
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
                  src={`${VIDEOS[active]}#t=0.2`}
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
