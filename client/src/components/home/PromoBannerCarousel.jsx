import * as React from 'react'
import { Container } from '@/components/ui/container'

// Homepage promotional banner carousel — one banner at a time, directly below
// Explore Destinations. Auto-rotates with a smooth slide; swipe/drag (touch or
// mouse) moves between banners. No visible arrows/dots by design — the grab
// cursor signals draggability. Artwork is served from the project's S3 media
// store (travel-crm/home/promo-banners/…), never recreated in HTML/CSS.
const BANNERS = [
  {
    src: 'https://24x7-website.s3.ap-south-1.amazonaws.com/travel-crm/home/promo-banners/new-year-sale-2026.avif',
    alt: 'New Year Early Bird Sale — get ₹10,000 off on group trips to Almaty, Bali and Sri Lanka',
  },
  {
    src: 'https://24x7-website.s3.ap-south-1.amazonaws.com/travel-crm/home/promo-banners/zamna-festival-bali.avif',
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

  // Auto-rotate whenever idle (paused on hover or while dragging).
  React.useEffect(() => {
    if (paused || dragX !== null) return undefined
    const id = setInterval(() => setIndex((v) => (v + 1) % count), ROTATE_MS)
    return () => clearInterval(id)
  }, [paused, dragX, count])

  function onPointerDown(e) {
    pointerStart.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e) {
    if (pointerStart.current === null) return
    setDragX(e.clientX - pointerStart.current)
  }

  function onPointerUp(e) {
    if (pointerStart.current === null) return
    const dx = e.clientX - pointerStart.current
    pointerStart.current = null
    setDragX(null)
    const threshold = Math.max(60, e.currentTarget.clientWidth * 0.08)
    if (Math.abs(dx) >= threshold) {
      // Manual navigation stays within the first/last banner (clamps).
      const next = dx < 0 ? index + 1 : index - 1
      setIndex(Math.min(count - 1, Math.max(0, next)))
    }
  }

  return (
    <section aria-roledescription="carousel" aria-label="Promotional banners" className="bg-background">
      <Container className="py-2">
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
