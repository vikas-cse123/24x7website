import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

// Display-only star rating. Supports halves visually via partial fill width.
export function StarRating({ value = 0, size = 'sm', className }) {
  const px = size === 'lg' ? 'h-6 w-6' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'
  const pct = Math.max(0, Math.min(100, (Number(value) || 0) * 20))
  return (
    <span
      role="img"
      aria-label={`Rated ${Number(value).toFixed(1)} out of 5 stars`}
      className={cn('relative inline-flex', className)}
    >
      <span className="flex text-muted-foreground/40">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn(px, 'shrink-0')} aria-hidden="true" />
        ))}
      </span>
      <span
        className="absolute inset-0 flex overflow-hidden text-amber-400"
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn(px, 'shrink-0 fill-current')} />
        ))}
      </span>
    </span>
  )
}

// Interactive star input for the write-review form.
export function StarRatingInput({ value, onChange, idPrefix = 'rating' }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Choose a star rating">
      {[1, 2, 3, 4, 5].map((i) => {
        const active = i <= value
        return (
          <button
            key={i}
            id={`${idPrefix}-star-${i}`}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} star${i > 1 ? 's' : ''}`}
            onClick={() => onChange(i)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star
              className={cn(
                'h-7 w-7 transition-colors',
                active ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/50'
              )}
              aria-hidden="true"
            />
          </button>
        )
      })}
    </div>
  )
}
