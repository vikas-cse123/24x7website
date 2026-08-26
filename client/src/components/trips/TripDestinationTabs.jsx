import * as React from 'react'
import { cn } from '@/lib/utils'

// Reusable Capture A Trip-style destination tabs for trip discovery:
// "All" + real destinations, horizontally scrollable when there are many.
// Fully keyboard accessible (buttons with aria-pressed).
export function TripDestinationTabs({ destinations = [], value = 'all', onChange, idPrefix = 'dest-tabs' }) {
  const items = [{ slug: 'all', name: 'All' }, ...destinations]

  return (
    <div
      role="group"
      aria-label="Filter trips by destination"
      className={cn(
        '-mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
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
