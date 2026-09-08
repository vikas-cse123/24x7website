import * as React from 'react'
import { X, Volume2, VolumeX } from 'lucide-react'
import { VIDEOS } from '@/lib/vibeVideos'

export function MobilePlayViewer({ open, onClose }) {
  const containerRef = React.useRef(null)
  const videoRefs = React.useRef([])
  const [muted, setMuted] = React.useState(true)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const scrollYRef = React.useRef(0)

  // Lock body scroll and save position when open
  React.useEffect(() => {
    if (!open) return undefined
    scrollYRef.current = window.scrollY
    const prevOverflow = document.body.style.overflow
    const prevPosition = document.body.style.position
    const prevTop = document.body.style.top
    const prevWidth = document.body.style.width
    document.body.style.overflow = 'hidden'
    // prevent underlying scroll on iOS
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollYRef.current}px`
    document.body.style.width = '100%'
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.position = prevPosition
      document.body.style.top = prevTop
      document.body.style.width = prevWidth
      window.scrollTo(0, scrollYRef.current)
    }
  }, [open])

  // Keyboard Esc to close
  React.useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Autoplay first video when opened
  React.useEffect(() => {
    if (!open) return
    const v = videoRefs.current[0]
    if (v) {
      v.muted = true
      setMuted(true)
      v.play().catch(() => {})
    }
    setActiveIndex(0)
    // reset scroll to top
    if (containerRef.current) containerRef.current.scrollTop = 0
  }, [open])

  // IntersectionObserver to play visible video and track active index
  React.useEffect(() => {
    if (!open) return undefined
    const root = containerRef.current
    if (!root) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.dataset.index)
          const video = entry.target.querySelector('video')
          if (!video) return
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setActiveIndex(idx)
            video.muted = muted
            video.play().catch(() => {})
          } else {
            video.pause()
          }
        })
      },
      { root, threshold: [0.6] }
    )
    const items = root.querySelectorAll('[data-index]')
    items.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [open, muted])

  // Keep current video muted state in sync
  React.useEffect(() => {
    const v = videoRefs.current[activeIndex]
    if (v) {
      v.muted = muted
      if (!v.paused) v.play().catch(() => {})
    }
  }, [muted, activeIndex])

  const toggleMute = React.useCallback(() => {
    setMuted((m) => !m)
  }, [])

  if (!open) return null

  if (VIDEOS.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black px-6 sm:hidden">
        <div className="text-center">
          <p className="text-sm text-white/80">No videos available yet.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-full bg-white px-5 text-sm font-medium text-black"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Travel videos"
      className="fixed inset-0 z-[60] bg-black sm:hidden"
      style={{ height: '100dvh', width: '100vw' }}
    >
      {/* Vertical snap container */}
      <div
        ref={containerRef}
        className="h-[100dvh] w-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {VIDEOS.map((src, i) => (
          <div
            key={src}
            data-index={i}
            className="relative h-[100dvh] w-screen snap-start snap-always bg-black"
          >
            <video
              ref={(el) => (videoRefs.current[i] = el)}
              src={src}
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
              onClick={(e) => e.stopPropagation()}
            />
            {/* Minimal dark loading — video poster is black; show spinner while loading */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="h-6 w-6 animate-pulse rounded-full bg-white/10" aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>

      {/* X Close — top-right safe area */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close video viewer"
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5 sm:top-5"
        style={{ top: 'max(1rem, env(safe-area-inset-top))', right: 'max(1rem, env(safe-area-inset-right))' }}
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Mute / Unmute — lower-right */}
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        className="absolute grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{
          right: 'max(1rem, env(safe-area-inset-right))',
          bottom: 'max(6rem, calc(env(safe-area-inset-bottom) + 5rem))',
        }}
      >
        {muted ? <VolumeX className="h-5 w-5" aria-hidden="true" /> : <Volume2 className="h-5 w-5" aria-hidden="true" />}
      </button>
    </div>
  )
}
