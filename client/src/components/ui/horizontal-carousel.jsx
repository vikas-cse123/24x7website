import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Reusable responsive horizontal carousel using CSS scroll snapping + native
// horizontal scrolling. Touch friendly and keyboard accessible via prev/next
// buttons and focusable cards.
export function HorizontalCarousel({ children, className, itemClassName, 'aria-label': ariaLabel = 'Carousel' }) {
  const trackRef = React.useRef(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  const updateScrollState = React.useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(maxScroll > 1 && el.scrollLeft < maxScroll - 1)
  }, [])

  const childCount = React.Children.count(children)

  React.useEffect(() => {
    updateScrollState()
    const el = trackRef.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)
    return () => observer.disconnect()
  }, [updateScrollState, childCount])

  const scrollByCards = React.useCallback((dir) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('[data-carousel-item]')
    const amount = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }, [])

  const arrowClassName = cn(
    'absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-card transition-colors',
    'hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex',
    'disabled:pointer-events-none disabled:opacity-40'
  )

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => scrollByCards(-1)}
        disabled={!canScrollLeft}
        aria-label="Scroll left"
        aria-disabled={!canScrollLeft}
        className={cn(arrowClassName, 'left-0')}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div
        ref={trackRef}
        role="region"
        aria-label={ariaLabel}
        onScroll={updateScrollState}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {React.Children.map(children, (child, i) => (
          <div data-carousel-item key={i} className={cn('shrink-0 snap-start', itemClassName)}>
            {child}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollByCards(1)}
        disabled={!canScrollRight}
        aria-label="Scroll right"
        aria-disabled={!canScrollRight}
        className={cn(arrowClassName, 'right-0')}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}