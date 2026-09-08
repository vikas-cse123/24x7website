import * as React from 'react'
import { cn } from '@/lib/utils'

// Reusable Capture A Trip-style destination tabs for trip discovery:
// "All" + real destinations, horizontally scrollable when there are many.
// Fully keyboard accessible (buttons with aria-pressed).
export function TripDestinationTabs({ destinations = [], value = 'all', onChange, idPrefix = 'dest-tabs' }) {
  const items = [{ slug: 'all', name: 'All' }, ...destinations]
  const scrollRef = React.useRef(null)
  const dragRef = React.useRef(null)
  const hasDraggedRef = React.useRef(false)
  const [dragging, setDragging] = React.useState(false)

  function onPointerDown(e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    hasDraggedRef.current = false
    dragRef.current = { startX: e.clientX, startScrollLeft: scrollRef.current?.scrollLeft ?? 0 }
    setDragging(true)
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
  }
  function onPointerMove(e) {
    if (!dragRef.current || !scrollRef.current) return
    if (e.cancelable) e.preventDefault()
    const walk = e.clientX - dragRef.current.startX
    if (Math.abs(walk) > 5) hasDraggedRef.current = true
    scrollRef.current.scrollLeft = dragRef.current.startScrollLeft - walk
  }
  function onPointerUp(e) {
    dragRef.current = null
    setDragging(false)
    try { e.currentTarget?.releasePointerCapture?.(e.pointerId) } catch {}
    if (hasDraggedRef.current) setTimeout(() => { hasDraggedRef.current = false }, 0)
  }

  return (
    <div
      ref={scrollRef}
      role="group"
      aria-label="Filter trips by destination"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={(e) => {
        if (hasDraggedRef.current) { e.preventDefault(); e.stopPropagation() }
      }}
      className={cn(
        '-mx-1 flex flex-nowrap gap-2 overflow-x-auto overflow-y-hidden scroll-smooth px-1 pb-1.5 touch-pan-x overscroll-x-contain',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        dragging ? 'cursor-grabbing select-none' : 'cursor-grab select-none'
      )}
    >
      {items.map((d) => {
        const active = value === d.slug
        return (
          <button
            key={d.slug}
            id={`${idPrefix}-${d.slug}`}
            type="button"
            onClick={() => onChange?.(d.slug)}
            aria-pressed={active}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-primary text-primary-foreground'
                : 'border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {d.name}
          </button>
        )
      })}
    </div>
  )
}
