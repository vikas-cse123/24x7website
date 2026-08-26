import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/reviews/StarRating'
import { reviewApi } from '@/services/reviews'
import { formatDateLong } from '@/lib/dates'

const STATUS_BADGE = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
}

export function AccountReviewsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['account', 'reviews'],
    queryFn: () => reviewApi.myReviews({ limit: 20 }),
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="border-destructive/40 p-6 text-sm text-destructive">
        Could not load your reviews. {error?.message || 'Please try again.'}
      </Card>
    )
  }

  const items = data?.data?.data?.items || []

  if (!items.length) {
    return (
      <Card className="p-12 text-center">
        <p className="text-lg font-medium">No reviews yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          After a confirmed trip, share your experience here.
        </p>
        <Link to="/trips">
          <Button className="mt-5">Explore upcoming trips</Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((r) => (
        <Card key={r.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold leading-snug">{r.trip?.name}</p>
              <p className="text-xs text-muted-foreground">
                {r.trip?.destination ? `${r.trip.destination.name}, ${r.trip.destination.country} · ` : ''}
                Reviewed {formatDateLong(r.createdAt)}
              </p>
            </div>
            <Badge variant={STATUS_BADGE[r.status] || 'secondary'}>
              {r.status === 'pending' ? 'Awaiting moderation' : r.status}
            </Badge>
          </div>
          <StarRating value={r.rating} className="mt-3" />
          {r.title && <p className="mt-2 text-sm font-medium">{r.title}</p>}
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
          {r.trip?.slug && (
            <Link
              to={`/trip/${r.trip.slug}`}
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              View trip
            </Link>
          )}
        </Card>
      ))}
    </div>
  )
}
