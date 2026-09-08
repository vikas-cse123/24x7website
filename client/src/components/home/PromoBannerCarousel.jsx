import * as React from 'react'
import { Container } from '@/components/ui/container'

// Homepage promotional banner carousel — one banner at a time, directly below
// Upcoming Group Trips. Auto-rotates with a smooth slide; swipe/drag (touch or
// mouse) moves between banners. No visible arrows/dots by design — the grab
// cursor signals draggability. Artwork is served from the project's S3 media
// store via the existing private media proxy (`/api/media/…`), never bundled
// into the frontend source/public folder and never from `travel-crm/`.
const BANNERS = [
  {
    src: '/api/media/website/homepage/new-year-sale-2026-web-cropped.avif',
    alt: 'New Year Early Bird Sale — get ₹10,000 off on group trips to Almaty, Bali and Sri Lanka',
  },
  {
    src: '/api/media/website/homepage/zamna-web-banner.avif',
    alt: 'Zamna Festival, Bali — packages starting from ₹58,999',
  },
]

const ROTATE_MS = 4500

export function PromoBannerCarousel() {
  const count = BANNERS.length
  const [index, setIndex] = React.useState(0)
  const [dragX, setDragX] = React.useState(null) // px offset while dragging
  const [paused, setPaused] = React.useState(false)
  const pointerStart = React.useRef(null)
  const gestureLock = React.useRef(null) // null | 'h' | 'v'

  const [hidden, setHidden] = React.useState(() =>
    typeof document !== 'undefined' ? document.hidden : false
  )

  React.useEffect(() => {
    const onVis = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Auto-rotate whenever idle (paused on hover, while dragging, or when tab hidden).
  React.useEffect(() => {
    if (paused || dragX !== null || hidden) return undefined
    const id = setInterval(() => setIndex((v) => (v + 1) % count), ROTATE_MS)
    return () => clearInterval(id)
  }, [paused, dragX, count, hidden])

  function onPointerDown(e) {
    pointerStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
    gestureLock.current = null
  }

  function onPointerMove(e) {
    if (!pointerStart.current) return
    const dx = e.clientX - pointerStart.current.x
    const dy = e.clientY - pointerStart.current.y
    if (!gestureLock.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      gestureLock.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      if (gestureLock.current === 'h') {
        try { e.currentTarget.setPointerCapture(pointerStart.current.id) } catch {}
      } else {
        return
      }
    }
    if (gestureLock.current === 'v') return
    setDragX(dx)
  }

  function onPointerUp(e) {
    if (!pointerStart.current) return
    const dx = e.clientX - pointerStart.current.x
    const wasHorizontal = gestureLock.current === 'h'
    const pid = pointerStart.current.id
    pointerStart.current = null
    gestureLock.current = null
    setDragX(null)
    try { e.currentTarget.releasePointerCapture(pid) } catch {}
    if (!wasHorizontal) return
    const threshold = Math.max(60, e.currentTarget.clientWidth * 0.08)
    if (Math.abs(dx) >= threshold) {
      const next = dx < 0 ? index + 1 : index - 1
      setIndex(Math.min(count - 1, Math.max(0, next)))
    }
  }

  return (
    <section aria-roledescription="carousel" aria-label="Promotional banners" className="bg-background">
      <Container className="max-w-none mx-0 w-full px-5 sm:px-6 lg:px-[55px] py-2">
        <div
          className="relative cursor-grab touch-pan-y select-none overflow-hidden rounded-xl active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="flex w-full transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(calc(${index * -100}% + ${dragX || 0}px))`,
              transitionDuration: dragX !== null ? '0ms' : undefined,
            }}
          >
            {BANNERS.map((banner, i) => (
              <img
                key={banner.src}
                src={banner.src}
                alt={banner.alt}
                width="1920"
                height="359"
                draggable={false}
                decoding="async"
                aria-hidden={i !== index}
                aria-label={`${i + 1} of ${count}`}
                className="block h-auto w-full shrink-0 basis-full"
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
