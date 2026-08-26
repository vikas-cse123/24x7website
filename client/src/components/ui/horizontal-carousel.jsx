import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Reusable responsive horizontal carousel using CSS scroll snapping + native
// horizontal scrolling. Touch friendly and keyboard accessible via prev/next
// buttons and focusable cards.
export function HorizontalCarousel({ children, className, itemClassName, 'aria-label': ariaLabel = 'Carousel' }) {
  const trackRef = React.useRef(null)

  const scrollByCards = React.useCallback((dir) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('[data-carousel-item]')
    const amount = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }, [])

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => scrollByCards(-1)}
        aria-label="Scroll left"
        className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-card transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div
        ref={trackRef}
        role="region"
        aria-label={ariaLabel}
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
        aria-label="Scroll right"
        className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-card transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}