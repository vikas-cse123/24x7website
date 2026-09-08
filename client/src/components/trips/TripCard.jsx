import { Link } from 'react-router-dom'
import { IndianRupee } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { StarRating } from '@/components/reviews/StarRating'
import { formatDateShort } from '@/lib/dates'
import { resolveTripPricing } from '@/lib/pricing'

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

export function TripCard({ trip }) {
  const pricing = getCardPricing(trip)
  const hasStartingPrice = trip.startingPrice != null && Number(trip.startingPrice) > 0
  const cardName = trip.cardName || trip.name
  const cardImage =
    trip.cardImage?.url || trip.cardImage?.secureUrl ? trip.cardImage : trip.heroImage
  const { originalPrice: autoOriginalPrice, discount: autoDiscount } = resolveTripPricing(trip)
  const tripDiscount = autoDiscount
  const tripOriginalPrice = autoOriginalPrice
  const tripDepartureDates = (Array.isArray(trip.departures) ? trip.departures : [])
    .map((d) => formatDateShort(d))
    .filter(Boolean)

  return (
    <Card className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-white transition-transform duration-200 hover:scale-[1.03] hover:z-10 hover:shadow-md focus-within:ring-2 focus-within:ring-ring lg:max-w-[300px]">
      <Link
        to={`/trip/${trip.slug}`}
        aria-label={`${cardName} — view trip details`}
        className="flex h-full flex-col focus-visible:outline-none"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <DestinationImage
            src={cardImage?.url}
            alt={cardImage?.alt || cardName}
            className="h-full w-full object-cover"
            draggable={false}
          />
          {pricing?.discountAmount != null && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              {`${pricing.currency === 'INR' ? '₹' : ''}${pricing.discountAmount.toLocaleString('en-IN')} Off`}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col bg-white px-4 pb-3 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium leading-none text-gray-700">
            <span aria-hidden="true" className="shrink-0 text-[13px] leading-none">⌛</span>
            <span>{trip.durationNights} nights / {trip.durationDays} days</span>
          </div>
          <h3 className="line-clamp-2 min-h-[2.75rem] text-[14px] font-semibold leading-snug text-gray-900">
            {cardName}
          </h3>

          {trip.ratingSummary?.total > 0 && (
            <p className="mt-1.5 flex items-center gap-1.5">
              <StarRating value={trip.ratingSummary.average} />
              <span className="text-xs font-semibold text-gray-900">
                {Number(trip.ratingSummary.average).toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">({trip.ratingSummary.total})</span>
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {pricing ? (
              <>
                <span className="inline-flex items-center text-[15px] font-bold leading-none text-gray-900">
                  <IndianRupee className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {pricing.price.toLocaleString('en-IN')}
                </span>
                {pricing.originalPrice != null && (
                  <span className="text-xs font-normal leading-none text-gray-400 line-through">
                    ₹{pricing.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {pricing.discountAmount != null && (
                  <span className="text-xs font-semibold leading-none text-red-600">
                    ₹{pricing.discountAmount.toLocaleString('en-IN')} Off
                  </span>
                )}
              </>
              ) : hasStartingPrice ? (
              <>
                <span className="inline-flex items-center text-[15px] font-bold leading-none text-gray-900">
                  <IndianRupee className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {trip.startingPrice.toLocaleString('en-IN')}
                </span>
                {tripOriginalPrice != null && tripDiscount != null && (
                  <span className="text-xs font-normal leading-none text-gray-400 line-through">
                    ₹{Number(tripOriginalPrice).toLocaleString('en-IN')}
                  </span>
                )}
                {tripDiscount != null && (
                  <span className="text-xs font-semibold leading-none text-red-600">
                    ₹{tripDiscount.toLocaleString('en-IN')} Off
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Price on request</span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1.5 border-t border-gray-100 pt-2.5">
            <span aria-hidden="true" className="shrink-0 text-[13px] leading-none">📅</span>
            <p className="min-w-0 flex-1 truncate text-xs leading-none text-gray-500">
              {trip.datesOnRequest
                ? 'All dates available'
                : pricing && pricing.dates.length > 0
                  ? `${pricing.dates.slice(0, 4).join(', ')}${pricing.dates.length > 4 ? ` +${pricing.extraDates} more` : ''}`
                  : tripDepartureDates.length > 0
                    ? `${tripDepartureDates.slice(0, 4).join(', ')}${tripDepartureDates.length > 4 ? ` +${tripDepartureDates.length - 4} more` : ''}`
                    : 'Departure dates coming soon'}
            </p>
          </div>
        </div>
      </Link>
    </Card>
  )
}
