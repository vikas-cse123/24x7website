import * as React from 'react'
import { cn } from '@/lib/utils'

// Prod-grade drag scroll — same technique as Explore Destinations:
// pointer capture + direct scrollLeft, no arrows, no layout shift,
// native touch momentum, select-none + cursor grab.
export function HorizontalCarousel({ children, className, itemClassName, 'aria-label': ariaLabel = 'Carousel', activeIndex, onActiveChange, loop = false }) {
  const trackRef = React.useRef(null)
  const isDraggingRef = React.useRef(false)
  const startXRef = React.useRef(0)
  const startYRef = React.useRef(0)
  const scrollLeftRef = React.useRef(0)
  const hasDraggedRef = React.useRef(false)
  const lockRef = React.useRef(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const onPointerDown = React.useCallback((e) => {
    if (e.button !== 0) return
    const el = trackRef.current
    if (!el) return
    hasDraggedRef.current = false
    lockRef.current = null
    startXRef.current = e.clientX
    startYRef.current = e.clientY
    scrollLeftRef.current = el.scrollLeft
  }, [])

  const onPointerMove = React.useCallback((e) => {
    const el = trackRef.current
    if (!el) return
    const walkX = e.clientX - startXRef.current
    const walkY = e.clientY - startYRef.current
    if (!isDraggingRef.current) {
      if (Math.abs(walkX) < 6 && Math.abs(walkY) < 6) return
      if (!lockRef.current) {
        lockRef.current = Math.abs(walkX) > Math.abs(walkY) ? 'h' : 'v'
      }
      if (lockRef.current === 'v') return
      if (Math.abs(walkX) <= 10) return
      isDraggingRef.current = true
      hasDraggedRef.current = true
      setIsDragging(true)
      el.style.scrollBehavior = 'auto'
      el.style.willChange = 'scroll-position'
      try {
        el.setPointerCapture(e.pointerId)
      } catch {}
    }
    if (lockRef.current === 'v') return
    if (e.cancelable) e.preventDefault()
    el.scrollLeft = scrollLeftRef.current - walkX
  }, [])

  const endDrag = React.useCallback((e) => {
    const wasDragging = isDraggingRef.current
    const lock = lockRef.current
    lockRef.current = null
    if (!wasDragging) return
    isDraggingRef.current = false
    setIsDragging(false)
    const el = trackRef.current
    if (el) {
      el.style.willChange = 'auto'
      el.style.scrollBehavior = 'smooth'
    }
    try {
      if (e && e.pointerId != null) trackRef.current?.releasePointerCapture(e.pointerId)
    } catch {}
    if (loop && onActiveChange != null && activeIndex != null && wasDragging && lock === 'h') {
      const count = React.Children.count(children)
      const walk = e ? e.clientX - startXRef.current : 0
      const maxScroll = el ? el.scrollWidth - el.clientWidth : 0
      const atStart = el ? el.scrollLeft <= 2 : false
      const atEnd = el ? el.scrollLeft >= maxScroll - 2 : false
      if (atEnd && walk < -10 && activeIndex === count - 1) {
        onActiveChange(0)
      } else if (atStart && walk > 10 && activeIndex === 0) {
        onActiveChange(count - 1)
      }
    }
    setTimeout(() => {
      hasDraggedRef.current = false
    }, 0)
  }, [activeIndex, onActiveChange, loop, children])

  const onClickCapture = React.useCallback((e) => {
    if (hasDraggedRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  // Keep dots in sync: report most visible child as active (mobile Reviews)
  React.useEffect(() => {
    if (!onActiveChange) return
    const el = trackRef.current
    if (!el) return
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const children = Array.from(el.children)
        if (!children.length) return
        // Find child with center closest to viewport center
        const trackRect = el.getBoundingClientRect()
        const trackCenter = trackRect.left + trackRect.width / 2
        let best = 0
        let bestDist = Infinity
        children.forEach((child, i) => {
          const r = child.getBoundingClientRect()
          const c = r.left + r.width / 2
          const d = Math.abs(c - trackCenter)
          if (d < bestDist) { bestDist = d; best = i }
        })
        onActiveChange(best)
      })
    }
    const onScroll = () => update()
    el.addEventListener('scroll', onScroll, { passive: true })
    // Observe intersections for snap correctness
    const io = new IntersectionObserver(() => update(), { root: el, threshold: 0.5 })
    Array.from(el.children).forEach((c) => io.observe(c))
    // Initial
    update()
    return () => { el.removeEventListener('scroll', onScroll); io.disconnect(); cancelAnimationFrame(raf) }
  }, [onActiveChange, children])

  // Clicking a dot scrolls to that index (controlled activeIndex)
  React.useEffect(() => {
    if (activeIndex == null) return
    const el = trackRef.current
    if (!el) return
    const child = el.children[activeIndex]
    if (child) child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeIndex])

  return (
    <div className={cn('', className)}>
      <div
        ref={trackRef}
        role="region"
        aria-label={ariaLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        className={cn(
          'flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] touch-pan-y scroll-smooth [&::-webkit-scrollbar]:hidden',
          isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
        )}
      >
        {React.Children.map(children, (child, i) => (
          <div data-carousel-item key={i} className={cn('shrink-0 snap-start', itemClassName)}>
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}