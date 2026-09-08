import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { StarRating } from '@/components/reviews/StarRating'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock'

const PREVIEW_CHARS = 200

function initialsOf(name) {
  const parts = String(name || '?').trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

function previewOf(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (clean.length <= PREVIEW_CHARS) return { text: clean, truncated: false }
  const sliced = clean.slice(0, PREVIEW_CHARS)
  const lastSpace = sliced.lastIndexOf(' ')
  return { text: (lastSpace > 120 ? sliced.slice(0, lastSpace) : sliced).trimEnd(), truncated: true }
}

function ReviewModal({ review, onClose }) {
  React.useEffect(() => {
    if (!review) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    lockBodyScroll()
    return () => {
      document.removeEventListener('keydown', onKey)
      unlockBodyScroll()
    }
  }, [review, onClose])

  if (!review) return null

  const src = review.image?.secureUrl || review.image?.url || ''

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Review by ${review.name}`}
        className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="relative shrink-0">
          {src ? (
            <img src={src} alt={review.name || 'Traveller photo'} className="h-60 w-full object-cover" />
          ) : (
            <div className="flex h-60 w-full items-center justify-center bg-muted">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-xl font-semibold text-primary">
                {initialsOf(review.name)}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close review"
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 text-center">
          <StarRating value={review.rating ?? 5} size="md" className="justify-center" />
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-700">{review.review}</p>
          <p className="mt-5 text-[15px] font-semibold text-gray-900">{review.name}</p>
        </div>
      </div>
    </div>,
    document.body
  )
}

function ReviewCard({ review, onReadMore }) {
  const src = review.image?.secureUrl || review.image?.url || ''
  const { text, truncated } = previewOf(review.review)

  return (
    <article className="flex items-stretch overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="relative w-[36%] shrink-0">
        {src ? (
          <img
            src={src}
            alt={review.name || 'Traveller photo'}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-muted">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
              {initialsOf(review.name)}
            </span>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center px-5 py-5 text-center">
        <StarRating value={review.rating ?? 5} size="md" />
        <p className="mt-3 text-[13px] leading-relaxed text-gray-600">
          {text}
          {truncated && (
            <button
              type="button"
              onClick={onReadMore}
              className="ml-1 text-[13px] font-medium text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Read more...
            </button>
          )}
        </p>
        <p className="mt-auto pt-4 text-sm font-medium text-gray-900">{review.name}</p>
      </div>
    </article>
  )
}

// Admin-curated, trip-specific reviews (independent from verified-booking
// reviews). The API exposes published reviews only, pre-sorted.
export function TripTravellerReviews({ trip }) {
  const [active, setActive] = React.useState(null)
  const reviews = Array.isArray(trip?.reviews) ? trip.reviews : []

  if (reviews.length === 0) return null

  const place = trip?.destination?.name || trip?.cardName || trip?.name || 'Trip'

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[26px]">
        {place} Reviews From Our Travellers
      </h2>
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        {reviews.map((r, i) => (
          <ReviewCard key={`${r.name}-${i}`} review={r} onReadMore={() => setActive(r)} />
        ))}
      </div>
      <ReviewModal review={active} onClose={() => setActive(null)} />
    </div>
  )
}
