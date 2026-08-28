import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Clock3, IndianRupee } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { HorizontalCarousel } from '@/components/ui/horizontal-carousel'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { tripApi } from '@/services/trips'
import { TRIP_TYPE_LABELS } from '@/schemas/trip'
import { formatDateShort } from '@/lib/dates'
import { StarRating } from '@/components/reviews/StarRating'

const LIMIT = 30

// Pick the display pricing for a card. Real batch pricing wins (the cheapest
// upcoming departure); Trip.startingPrice is only the fallback.
function getCardPricing(trip) {
  const batches = Array.isArray(trip.batches) ? trip.batches : []
  if (batches.length === 0) return null
  const cheapest = batches.reduce((min, b) => (Number(b.price) < Number(min.price) ? b : min), batches[0])
  const hasDiscount = cheapest.originalPrice != null && cheapest.discountAmount != null
  const soldOut = cheapest.availableSeats != null && Number(cheapest.availableSeats) <= 0
  const scarce =
    !soldOut &&
    cheapest.totalSeats != null &&
    cheapest.availableSeats != null &&
    Number(cheapest.availableSeats) > 0 &&
    Number(cheapest.availableSeats) <= Math.max(1, Math.ceil(Number(cheapest.totalSeats) * 0.2))
  return {
    price: Number(cheapest.price),
    originalPrice: hasDiscount ? Number(cheapest.originalPrice) : null,
    discountAmount: hasDiscount ? Number(cheapest.discountAmount) : null,
    currency: cheapest.currency || 'INR',
    dates: batches.map((b) => formatDateShort(b.departureDate)),
    availability: soldOut ? 'Sold out' : scarce ? `Only ${cheapest.availableSeats} seats left` : null,
  }
}

// Reusable horizontal trip card, modelled on the Capture A Trip card
// hierarchy (image → duration → name → price/original/discount → dates)
// using our own 24x7Chhutti identity and only real database values.
export function HomepageTripCard({ trip }) {
  const pricing = getCardPricing(trip)
  const hasStartingPrice = trip.startingPrice !== null && trip.startingPrice !== undefined

  return (
    <Link
      to={`/trip/${trip.slug}`}
      className="group block w-full overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[4/5]">
        <DestinationImage
          src={trip.heroImage?.url}
          alt={trip.heroImage?.alt || trip.name}
          className="h-full w-full"
        />
        {(pricing?.discountAmount != null || trip.featured) && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
            {pricing?.discountAmount != null
              ? `₹${pricing.discountAmount.toLocaleString('en-IN')} Off`
              : 'Featured'}
          </span>
        )}
        {trip.tripType && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-background/90 px-2.5 py-0.5 text-xs font-medium capitalize text-foreground">
            {TRIP_TYPE_LABELS[trip.tripType] || trip.tripType}
          </span>
        )}
        {pricing?.availability && (
          <span
            className={`absolute bottom-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              pricing.availability === 'Sold out'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {pricing.availability}
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          {trip.durationNights} nights / {trip.durationDays} days
        </p>

        <h3 className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
          {trip.name}
        </h3>

        {trip.ratingSummary?.total > 0 && (
          <p className="mt-1.5 flex items-center gap-1.5">
            <StarRating value={trip.ratingSummary.average} />
            <span className="text-xs font-semibold text-foreground">
              {Number(trip.ratingSummary.average).toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({trip.ratingSummary.total})
            </span>
          </p>
        )}

        {/* Price hierarchy */}
        <div className="mt-2">
          {pricing ? (
            <>
              <p className="flex items-center text-base font-bold leading-none">
                <IndianRupee className="h-4 w-4" aria-hidden="true" />
                {pricing.price.toLocaleString('en-IN')}
                {pricing.originalPrice != null && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground line-through">
                    ₹{pricing.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </p>
              {pricing.discountAmount != null && (
                <p className="mt-0.5 text-xs font-medium text-primary">
                  ₹{pricing.discountAmount.toLocaleString('en-IN')} Off
                </p>
              )}
            </>
          ) : hasStartingPrice ? (
            <p className="text-sm font-semibold">
              <span className="text-muted-foreground">from </span>
              <span className="inline-flex items-center">
                <IndianRupee className="h-4 w-4" aria-hidden="true" />
                {trip.startingPrice.toLocaleString('en-IN')}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Price on request</p>
          )}
        </div>

        {/* Real departure dates (never fabricated). */}
        <p
          className={`mt-2 border-t border-border pt-2 text-xs leading-relaxed ${
            pricing ? 'text-foreground/80' : 'text-muted-foreground/80'
          }`}
        >
          <CalendarDays className="mr-1 inline h-3.5 w-3.5 align-[-3px]" aria-hidden="true" />
          {pricing && pricing.dates.length > 0 ? (
            <>
              {pricing.dates.slice(0, 5).join(', ')}
              {pricing.dates.length > 5 ? ` +${pricing.dates.length - 5}` : ''}
            </>
          ) : (
            'Departure dates coming soon'
          )}
        </p>
      </div>
    </Link>
  )
}

export function UpcomingTripsSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['home', 'trips'],
    queryFn: () => tripApi.list({ limit: LIMIT, includeBatches: true }),
  })

  const trips = data?.data?.data?.items || []

  const destinationTabs = React.useMemo(() => {
    const seen = new Map()
    trips.forEach((t) => {
      if (t.destination && !seen.has(t.destination.slug)) {
        seen.set(t.destination.slug, t.destination.name)
      }
    })
    return Array.from(seen.entries()).map(([slug, name]) => ({ slug, name }))
  }, [trips])

  return (
    <section className="border-y border-border bg-muted/30 py-12 lg:py-16">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Upcoming Group Trips</h2>
          <Link
            to="/trips"
            className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            See All
          </Link>
        </div>

        {/* Destination tabs route into the shared discovery system (/trips). */}
        <div className="mt-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            to="/trips"
            aria-label="Browse all upcoming trips"
            className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            All
          </Link>
          {destinationTabs.map((t) => (
            <Link
              key={t.slug}
              to={`/trips?destination=${t.slug}`}
              aria-label={`View ${t.name} trips`}
              className="shrink-0 rounded-full border border-input bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t.name}
            </Link>
          ))}
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : isError ? (
            <p className="rounded-xl border border-destructive/40 p-8 text-center text-sm text-destructive">
              Could not load trips.
            </p>
          ) : trips.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-background p-10 text-center text-sm text-muted-foreground">
              No trips available yet.
            </p>
          ) : (
            <HorizontalCarousel aria-label="Upcoming group trips" itemClassName="w-[15rem] sm:w-[17rem] lg:w-[18rem]">
              {trips.map((trip) => (
                <HomepageTripCard key={trip.id} trip={trip} />
              ))}
            </HorizontalCarousel>
          )}
        </div>
      </Container>
    </section>
  )
}
