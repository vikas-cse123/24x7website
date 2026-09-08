import * as React from 'react'
import { cn } from '@/lib/utils'

// Prod-grade drag scroll — same technique as Explore Destinations:
// pointer capture + direct scrollLeft, no arrows, no layout shift,
// native touch momentum, select-none + cursor grab.
export function HorizontalCarousel({ children, className, itemClassName, 'aria-label': ariaLabel = 'Carousel' }) {
  const trackRef = React.useRef(null)
  const isDraggingRef = React.useRef(false)
  const startXRef = React.useRef(0)
  const scrollLeftRef = React.useRef(0)
  const hasDraggedRef = React.useRef(false)
  const [isDragging, setIsDragging] = React.useState(false)

  const onPointerDown = React.useCallback((e) => {
    if (e.pointerType !== 'mouse') return
    if (e.button !== 0) return
    const el = trackRef.current
    if (!el) return
    hasDraggedRef.current = false
    startXRef.current = e.clientX
    scrollLeftRef.current = el.scrollLeft
  }, [])

  const onPointerMove = React.useCallback((e) => {
    if (e.pointerType !== 'mouse') return
    const el = trackRef.current
    if (!el) return
    const walk = e.clientX - startXRef.current
    if (!isDraggingRef.current) {
      if (Math.abs(walk) <= 10) return
      isDraggingRef.current = true
      hasDraggedRef.current = true
      setIsDragging(true)
      el.style.scrollBehavior = 'auto'
      el.style.willChange = 'scroll-position'
      try {
        el.setPointerCapture(e.pointerId)
      } catch {}
    }
    if (e.cancelable) e.preventDefault()
    el.scrollLeft = scrollLeftRef.current - walk
  }, [])

  const endDrag = React.useCallback((e) => {
    if (!isDraggingRef.current) return
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
    setTimeout(() => {
      hasDraggedRef.current = false
    }, 0)
  }, [])

  const onClickCapture = React.useCallback((e) => {
    if (hasDraggedRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

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
          'flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] select-none touch-pan-x scroll-smooth [&::-webkit-scrollbar]:hidden',
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
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