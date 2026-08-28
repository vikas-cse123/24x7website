import { Link } from 'react-router-dom'
import { MapPin, IndianRupee, CalendarDays, Clock3 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { StarRating } from '@/components/reviews/StarRating'
import { TRIP_TYPE_LABELS } from '@/schemas/trip'
import { formatDateShort } from '@/lib/dates'

// Resolve display pricing from real data only.
// 1. Embedded upcoming public batches (discovery/homepage): cheapest batch wins,
//    its originalPrice drives the strikethrough + derived discount.
// 2. Else a server-computed pricingSummary (batch-aware queries).
// 3. Else the Trip.startingPrice fallback. Nothing is ever fabricated.
function getCardPricing(trip) {
  const batches = Array.isArray(trip.batches) ? trip.batches : []
  if (batches.length > 0) {
    const cheapest = batches.reduce(
      (min, b) => (Number(b.price) < Number(min.price) ? b : min),
      batches[0]
    )
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
      extraDates: Math.max(0, batches.length - 4),
      availability: soldOut ? 'Sold out' : scarce ? `Only ${cheapest.availableSeats} seats left` : null,
      source: 'batches',
    }
  }
  const summary = trip.pricingSummary
  if (summary && summary.price != null) {
    return {
      price: Number(summary.price),
      originalPrice: summary.originalPrice != null ? Number(summary.originalPrice) : null,
      discountAmount: summary.discountAmount != null ? Number(summary.discountAmount) : null,
      currency: summary.currency || 'INR',
      dates:
        summary.soonestDeparture != null ? [formatDateShort(summary.soonestDeparture)] : [],
      extraDates: summary.upcomingCount != null ? Math.max(0, summary.upcomingCount - 1) : 0,
      availability: null,
      source: 'summary',
    }
  }
  return null
}

// Reusable public trip card — Capture A Trip information hierarchy with our own
// identity: image → duration → name → destination → price/original/discount →
// departure dates. Fully clickable, keyboard accessible.
export function TripCard({ trip }) {
  const pricing = getCardPricing(trip)
  const hasStartingPrice = trip.startingPrice !== null && trip.startingPrice !== undefined

  return (
    <Card className="group h-full overflow-hidden transition-shadow hover:shadow-card-hover focus-within:ring-2 focus-within:ring-ring">
      <Link
        to={`/trip/${trip.slug}`}
        aria-label={`${trip.name} — view trip details`}
        className="block focus-visible:outline-none"
      >
        <div className="relative aspect-[3/4]">
          <DestinationImage
            src={trip.heroImage?.url}
            alt={trip.heroImage?.alt || trip.name}
            className="h-full w-full"
          />
          <WishlistButton type="trip" id={trip.id || trip._id} className="absolute right-2.5 bottom-2.5" />
          {(pricing?.discountAmount != null || trip.featured) && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              {pricing?.discountAmount != null
                ? `${pricing.currency === 'INR' ? '₹' : ''}${pricing.discountAmount.toLocaleString('en-IN')} Off`
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
            <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {trip.durationDays} days / {trip.durationNights} nights
          </p>

          <h3 className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
            {trip.name}
          </h3>

          {trip.destination?.name && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {trip.destination.name}
              {trip.destination.country ? `, ${trip.destination.country}` : ''}
            </p>
          )}

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

          <div className="mt-2 min-h-[2.5rem]">
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
                    ₹{pricing.discountAmount.toLocaleString('en-IN')} Off · per person
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

          <p className="mt-2 border-t border-border pt-2 text-xs leading-relaxed text-muted-foreground/80">
            <CalendarDays className="mr-1 inline h-3.5 w-3.5 align-[-3px]" aria-hidden="true" />
            {pricing && pricing.dates.length > 0 ? (
              <>
                {pricing.dates.slice(0, 4).join(', ')}
                {pricing.dates.length > 4 && ` +${pricing.extraDates} more`}
              </>
            ) : (
              'Departure dates coming soon'
            )}
          </p>
        </div>
      </Link>
    </Card>
  )
}
