import { Link } from 'react-router-dom'
import { IndianRupee, CalendarDays, Hourglass } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { StarRating } from '@/components/reviews/StarRating'
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
  // Independent card fields with legacy fallback to the canonical trip values.
  const cardName = trip.cardName || trip.name
  const cardImage =
    trip.cardImage?.url || trip.cardImage?.secureUrl ? trip.cardImage : trip.heroImage
  // Trip-level discount, derived only when an original price above the selling
  // price is actually stored. Never fabricated.
  const tripDiscount =
    trip.originalPrice != null &&
    trip.startingPrice != null &&
    Number(trip.originalPrice) > Number(trip.startingPrice)
      ? Number(trip.originalPrice) - Number(trip.startingPrice)
      : null
  // Trip-level departure dates (admin-managed). Batches/summaries take display
  // precedence via `pricing.dates` when present.
  const tripDepartureDates = (Array.isArray(trip.departures) ? trip.departures : [])
    .map((d) => formatDateShort(d))
    .filter(Boolean)

  return (
    <Card className="group h-full w-full overflow-hidden transition-shadow hover:shadow-card-hover focus-within:ring-2 focus-within:ring-ring lg:max-w-[300px]">
      <Link
        to={`/trip/${trip.slug}`}
        aria-label={`${cardName} — view trip details`}
        className="block focus-visible:outline-none"
      >
        <div className="relative aspect-[1.377/1] lg:aspect-[3/2]">
          <DestinationImage
            src={cardImage?.url}
            alt={cardImage?.alt || cardName}
            className="h-full w-full"
          />
          {/* Curved white transition: the card body flows into the image with a
              smooth asymmetric curve (higher on the left, behind the duration
              row). Pure overlay — adds no layout height; badges render above it. */}
          <svg
            aria-hidden="true"
            focusable="false"
            preserveAspectRatio="none"
            viewBox="0 0 400 32"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 w-full"
          >
            <path d="M0 32 L0 14 C 150 14 250 26 400 24 L400 32 Z" fill="white" />
          </svg>
          <WishlistButton type="trip" id={trip.id || trip._id} className="absolute right-2.5 bottom-2.5" />
          {pricing?.discountAmount != null && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              {`${pricing.currency === 'INR' ? '₹' : ''}${pricing.discountAmount.toLocaleString('en-IN')} Off`}
            </span>
          )}
        </div>

        <div className="p-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Hourglass className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {trip.durationNights} nights / {trip.durationDays} days
          </p>

          <h3 className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
            {cardName}
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
                  <p className="mt-0.5 text-xs font-medium text-red-600">
                    ₹{pricing.discountAmount.toLocaleString('en-IN')} Off · per person
                  </p>
                )}
              </>
            ) : hasStartingPrice ? (
              <>
                <p className="flex items-center text-base font-bold leading-none">
                  <IndianRupee className="h-4 w-4" aria-hidden="true" />
                  {trip.startingPrice.toLocaleString('en-IN')}
                  {trip.originalPrice != null && tripDiscount != null && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground line-through">
                      ₹{Number(trip.originalPrice).toLocaleString('en-IN')}
                    </span>
                  )}
                </p>
                {tripDiscount != null && (
                  <p className="mt-0.5 text-xs font-medium text-red-600">
                    ₹{tripDiscount.toLocaleString('en-IN')} Off
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Price on request</p>
            )}
          </div>

          <p className="mt-2 border-t border-border pt-2 text-xs leading-relaxed text-muted-foreground/80">
            <CalendarDays className="mr-1 inline h-3.5 w-3.5 align-[-3px]" aria-hidden="true" />
            {trip.datesOnRequest ? (
              'Dates on Request'
            ) : pricing && pricing.dates.length > 0 ? (
              <>
                {pricing.dates.slice(0, 4).join(', ')}
                {pricing.dates.length > 4 && ` +${pricing.extraDates} more`}
              </>
            ) : tripDepartureDates.length > 0 ? (
              <>
                {tripDepartureDates.slice(0, 4).join(', ')}
                {tripDepartureDates.length > 4 && ` +${tripDepartureDates.length - 4} more`}
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
