import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, Loader2, PenLine, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { StarRating, StarRatingInput } from '@/components/reviews/StarRating'
import { reviewApi } from '@/services/reviews'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/ui'
import { formatDateLong } from '@/lib/dates'

function initialsOf(name) {
  const parts = String(name || '?').trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

function ReviewCard({ review }) {
  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
            aria-hidden="true"
          >
            {initialsOf(review.travellerName || review.authorName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{review.travellerName || review.authorName}</p>
            <p className="text-xs text-muted-foreground">{formatDateLong(review.createdAt)}</p>
          </div>
        </div>
        <Badge variant="success" className="shrink-0">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          Verified booking
        </Badge>
      </div>
      <StarRating value={review.rating} className="mt-3" />
      {review.title && <p className="mt-2 text-sm font-semibold">{review.title}</p>}
      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{review.text}</p>
    </article>
  )
}

const ELIGIBILITY_MESSAGES = {
  'login-required': null, // handled by CTA (opens login)
  'no-booking': 'Reviews are open to travellers who have booked this trip. Book a departure to share your experience!',
  'booking-cancelled': 'This booking was cancelled, so it can no longer be reviewed.',
  'booking-not-confirmed': 'You can review this trip once your booking is confirmed. Our team will confirm after payment is arranged.',
  'already-reviewed': null,
}

export function TripReviews({ trip }) {
  const queryClient = useQueryClient()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const openAuthModal = useUIStore((s) => s.openAuthModal)

  const [page, setPage] = React.useState(1)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [rating, setRating] = React.useState(0)
  const [title, setTitle] = React.useState('')
  const [text, setText] = React.useState('')
  const [formErrors, setFormErrors] = React.useState({})

  // Public reviews + summary.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reviews', trip.id, page],
    queryFn: () => reviewApi.listByTrip(trip.slug, { page, limit: 4 }),
    placeholderData: (prev) => prev,
  })
  const result = data?.data?.data
  const reviews = result?.items || []
  const summary = result?.summary

  // Eligibility (only meaningful when logged in).
  const eligibility = useQuery({
    queryKey: ['reviews', 'eligibility', trip.id],
    queryFn: () => reviewApi.eligibility(trip.slug),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 15_000,
  })
  const elig = eligibility.data?.data?.data

  function validateForm() {
    const errors = {}
    if (!rating) errors.rating = 'Please choose a star rating'
    if (title.trim().length < 3) errors.title = 'Title must be at least 3 characters'
    if (text.trim().length < 10) errors.text = 'Review must be at least 10 characters'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const submitMutation = useMutation({
    mutationFn: (payload) => reviewApi.create(payload),
    onSuccess: () => {
      toast.success('Thanks! Your review was submitted for moderation.')
      setDialogOpen(false)
      setRating(0); setTitle(''); setText(''); setFormErrors({})
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['account', 'reviews'] })
    },
    onError: (err) => toast.error(err.message || 'Could not submit your review'),
  })

  function handleCtaClick() {
    if (!isAuthenticated) return openAuthModal()
    setDialogOpen(true)
  }

  function submit(e) {
    e.preventDefault()
    if (!validateForm()) return
    submitMutation.mutate({ tripId: trip.id, rating, title: title.trim(), text: text.trim() })
  }

  const alreadyReviewed = elig?.reason === 'already-reviewed'
  const showIneligibleMessage =
    isAuthenticated && !authLoading && elig && !elig.eligible && !alreadyReviewed &&
    ELIGIBILITY_MESSAGES[elig.reason]

  const dist = summary?.distribution || {}

  return (
    <section aria-label={`Reviews for ${trip.name}`}>
      {/* Summary */}
      <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:p-6">
        <div className="text-center sm:w-40 sm:text-left">
          {summary && summary.total > 0 ? (
            <>
              <p className="text-4xl font-bold leading-none">{Number(summary.average).toFixed(1)}</p>
              <StarRating value={summary.average} size="md" className="mt-1.5 justify-center sm:justify-start" />
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.total} verified review{summary.total === 1 ? '' : 's'}
              </p>
            </>
          ) : (
            <>
              <p className="text-4xl font-bold leading-none text-muted-foreground">—</p>
              <p className="mt-2 text-xs text-muted-foreground">No ratings yet</p>
            </>
          )}
        </div>

        {/* Distribution bars */}
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = Number(dist[star] || 0)
            const pct = summary?.total > 0 ? Math.round((count / summary.total) * 100) : 0
            return (
              <div key={star} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-8 shrink-0 text-right">{star} ★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-8 shrink-0 tabular-nums">{count}</span>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="sm:w-48">
          {!authLoading && (
            alreadyReviewed ? (
              <Badge variant="secondary" className="w-full justify-center py-1.5">
                You reviewed this trip
              </Badge>
            ) : (
              <Button type="button" className="w-full" onClick={handleCtaClick}>
                <PenLine className="h-4 w-4" aria-hidden="true" />
                Write a Review
              </Button>
            )
          )}
        </div>
      </div>

      {/* Ineligibility / moderation messages */}
      {showIneligibleMessage && (
        <p role="status" className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          {ELIGIBILITY_MESSAGES[elig.reason]}
        </p>
      )}
      {alreadyReviewed && (
        <p role="status" className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Thanks for reviewing this trip!
          <Badge variant={elig.review.status === 'approved' ? 'success' : 'warning'}>
            Your review: {elig.review.status}
          </Badge>
          Track it any time from My Account → Reviews.
        </p>
      )}

      {/* Review cards */}
      {isLoading && !result ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <p role="alert" className="mt-5 rounded-xl border border-destructive/40 p-6 text-center text-sm text-destructive">
          Could not load reviews.
        </p>
      ) : reviews.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          No reviews yet — be the first to share your experience after your trip!
        </p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}

      {(result?.totalPages > 1) && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={result.page <= 1}
            onClick={() => setPage(result.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {result.page} of {result.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={result.page >= result.totalPages}
            onClick={() => setPage(result.page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Write-review dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <div className="p-6">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              aria-label="Close review form"
              className="absolute right-14 top-5 z-10 hidden rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <h2 className="text-lg font-semibold">Review {trip.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Reviews are moderated before they appear publicly.
            </p>
            <form onSubmit={submit} noValidate className="mt-4 space-y-4">
              <div>
                <Label>Your rating *</Label>
                <div className="mt-1.5">
                  <StarRatingInput value={rating} onChange={setRating} idPrefix="trip-review" />
                </div>
                {formErrors.rating && <p className="mt-1 text-xs text-destructive">{formErrors.rating}</p>}
              </div>
              <div>
                <Label htmlFor="rv-title">Title *</Label>
                <Input
                  id="rv-title"
                  className="mt-1.5"
                  maxLength={150}
                  placeholder="Sum up your trip in a line"
                  value={title}
                  aria-invalid={!!formErrors.title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {formErrors.title && <p className="mt-1 text-xs text-destructive">{formErrors.title}</p>}
              </div>
              <div>
                <Label htmlFor="rv-text">Your review *</Label>
                <Textarea
                  id="rv-text"
                  rows={4}
                  maxLength={2000}
                  placeholder="What made this trip special?"
                  value={text}
                  aria-invalid={!!formErrors.text}
                  onChange={(e) => setText(e.target.value)}
                />
                {formErrors.text && <p className="mt-1 text-xs text-destructive">{formErrors.text}</p>}
              </div>
              {submitMutation.isError && (
                <p role="alert" className="text-xs text-destructive">
                  {submitMutation.error?.message}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {submitMutation.isPending ? 'Submitting…' : 'Submit review'}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
