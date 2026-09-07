import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarDays, IndianRupee, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { tripBatchApi } from '@/services/tripBatches'
import { formatDateLong, formatDateShort, nightsBetween } from '@/lib/dates'

function DepartureRow({ batch, tripSlug }) {
  const nights = nightsBetween(batch.departureDate, batch.returnDate)
  const days = nights === null ? null : nights + 1
  const hasDiscount = batch.originalPrice != null && batch.discountAmount != null
  const isFull = batch.status === 'full' || batch.availableSeats <= 0

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card sm:p-5 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-semibold leading-tight">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{formatDateLong(batch.departureDate)}</span>
          <span className="text-muted-foreground">→</span>
          <span>{formatDateLong(batch.returnDate)}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {nights} Nights / {days} Days
          <span className="mx-2">·</span>
          {isFull ? (
            <span className="font-medium text-destructive">Sold out</span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {batch.availableSeats} seats available
            </span>
          )}
        </p>
        {hasDiscount && (
          <Badge variant="success" className="mt-2">
            ₹{Number(batch.discountAmount).toLocaleString('en-IN')} Off
          </Badge>
        )}
      </div>

      <div className="flex items-end justify-between gap-4 md:flex-col md:items-end md:gap-1">
        <div className="text-left md:text-right">
          <p className="flex items-center text-2xl font-bold leading-none md:justify-end">
            <IndianRupee className="h-5 w-5" aria-hidden="true" />
            {Number(batch.price).toLocaleString('en-IN')}
            {hasDiscount && (
              <>
                {' '}
                <span className="ml-1 text-sm font-normal text-muted-foreground line-through">
                  ₹{Number(batch.originalPrice).toLocaleString('en-IN')}
                </span>
              </>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">per person · {batch.currency}</p>
        </div>
        {/* Book Now starts the real booking flow (Phase 9). Sold-out departures
            cannot be booked. */}
        {isFull ? (
          <Button size="sm" disabled className="shrink-0">
            Sold out
          </Button>
        ) : (
          <Link to={`/booking/${tripSlug}?batch=${batch.id}`} className="shrink-0">
            <Button size="sm">Book Now</Button>
          </Link>
        )}
      </div>
    </div>
  )
}

function DepartureSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  )
}

// Real upcoming departures for a trip (published, open/full, future — enforced
// server-side, sorted by earliest departure).
// `batches`/`isLoading` may be passed in by a parent that already loaded the
// same query (TripPage), so the data is fetched once and shared.
export function TripDepartures({ trip, batches, isLoading: isLoadingProp, isError: isErrorProp }) {
  const ownQuery = useQuery({
    queryKey: ['trip-batches', trip.id],
    queryFn: () => tripBatchApi.listByTrip(trip.id),
    retry: false,
    staleTime: 30_000,
    enabled: batches === undefined,
  })

  const isLoading = isLoadingProp ?? ownQuery.isLoading
  const isError = isErrorProp ?? ownQuery.isError
  const list = batches ?? ownQuery.data?.data?.data?.items ?? []

  if (isLoading) return <DepartureSkeleton />

  // No departures: render nothing (never an empty-state box).
  if (!isError && list.length === 0) return null

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">Upcoming departures</h2>
        {list.length > 0 && (
          <p className="hidden text-xs text-muted-foreground sm:block">
            Next: {formatDateShort(list[0].departureDate)}
          </p>
        )}
      </div>

      {isError ? (
        <p className="mt-4 rounded-xl border border-destructive/40 p-6 text-center text-sm text-destructive">
          Could not load departures.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {list.map((batch) => (
            <DepartureRow key={batch.id} batch={batch} tripSlug={trip.slug} />
          ))}
        </div>
      )}
    </div>
  )
}
