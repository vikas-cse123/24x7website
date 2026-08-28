import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { MapPin, IndianRupee, CalendarDays, Users, ArrowLeft, Clock, HelpCircle, Star } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { Accordion } from '@/components/ui/accordion'
import { TripCard } from '@/components/trips/TripCard'
import { TripGallery } from '@/components/trips/TripGallery'
import { TravelerGallery } from '@/components/trips/TravelerGallery'
import { tripApi } from '@/services/trips'
import { tripBatchApi } from '@/services/tripBatches'
import { TripDepartures } from '@/components/trips/TripDepartures'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { PlanTripTrigger } from '@/components/enquiry/PlanTripTrigger'
import { TripReviews } from '@/components/trips/TripReviews'
import { faqApi } from '@/services/faqs'
import { useSeo, tripSeoTitle } from '@/lib/seo'
import { TRIP_TYPE_LABELS } from '@/schemas/trip'
import { formatDateShort } from '@/lib/dates'

function BulletList({ title, items, icon: Icon }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {Icon && <Icon className="h-5 w-5 text-primary" />}
        {title}
      </h2>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TripPage() {
  const { slug } = useParams()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['trips', 'slug', slug],
    queryFn: () => tripApi.getBySlug(slug),
    retry: false,
  })

  const trip = data?.data?.data

  // Upcoming departures loaded once and shared with the departures section and
  // the sticky booking card (no duplicate requests).
  const batchesQuery = useQuery({
    queryKey: ['trip-batches', trip?.id],
    queryFn: () => tripBatchApi.listByTrip(trip.id),
    retry: false,
    staleTime: 30_000,
    enabled: !!trip,
  })
  const upcomingBatches = batchesQuery.data?.data?.data?.items || []
  const nextBatch = upcomingBatches[0]

  // Real display pricing: the cheapest upcoming public departure wins (matches
  // the discovery cards); Trip.startingPrice is only the fallback when no
  // departure is scheduled yet. Never fabricated.
  const cheapestBatch = upcomingBatches.length
    ? upcomingBatches.reduce((min, b) => (Number(b.price) < Number(min.price) ? b : min), upcomingBatches[0])
    : null

  useSeo({
    title: trip ? tripSeoTitle(trip.name) : undefined,
    description: trip?.seoDescription || trip?.shortDescription,
    canonical: trip ? `${window.location.origin}/trip/${trip.slug}` : undefined,
  })

  if (isLoading) {
    return (
      <Container className="py-10">
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        <div className="mt-6 h-8 w-1/2 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-muted" />
      </Container>
    )
  }

  if (isError || !trip) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold">Trip not found</h1>
        <p className="mt-2 text-muted-foreground">This trip may have been unpublished or removed.</p>
        <Link
          to="/trips"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" />
          Browse trips
        </Link>
      </Container>
    )
  }

  const hasPrice = trip.startingPrice !== null && trip.startingPrice !== undefined

  return (
    <Container className="py-8 lg:py-12">
      <Link
        to="/trips"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <ArrowLeft className="h-4 w-4" />
        All trips
      </Link>

      {/* Hero */}
      <div className="mt-4 relative overflow-hidden rounded-2xl">
        <DestinationImage
          src={trip.heroImage?.url}
          alt={trip.heroImage?.alt || trip.name}
          className="aspect-[16/7] w-full"
        />
        <WishlistButton type="trip" id={trip.id} className="absolute right-3 top-3" size={40} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{trip.name}</h1>
            {trip.featured && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                Featured
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {trip.destination && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <Link to={`/destination/${trip.destination.slug}`} className="hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                  {trip.destination.name}
                </Link>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {trip.durationDays} Days / {trip.durationNights} Nights
            </span>
            <span className="inline-flex items-center gap-1.5 capitalize">
              <Clock className="h-4 w-4" />
              {TRIP_TYPE_LABELS[trip.tripType] || trip.tripType}
            </span>
            {trip.maxGroupSize > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Max {trip.maxGroupSize}
              </span>
            )}
          </div>

          {trip.shortDescription && (
            <p className="mt-5 text-lg text-muted-foreground">{trip.shortDescription}</p>
          )}

          {trip.description && (
            <div className="mt-5 space-y-3 whitespace-pre-line text-foreground/90">
              <p>{trip.description}</p>
            </div>
          )}

          {/* Upcoming departures with real batch pricing/availability */}
          <div className="mt-10">
            <TripDepartures
              trip={trip}
              batches={upcomingBatches}
              isLoading={batchesQuery.isLoading}
              isError={batchesQuery.isError}
            />
          </div>

          {/* Itinerary */}
          {trip.itinerary && trip.itinerary.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-semibold">Itinerary</h2>
              <div className="mt-4 space-y-4">
                {trip.itinerary.map((day) => (
                  <div key={day.dayNumber} className="rounded-xl border border-border bg-card p-5 shadow-card">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                        {day.dayNumber}
                      </span>
                      <h3 className="font-semibold">{day.title || `Day ${day.dayNumber}`}</h3>
                    </div>
                    {day.description && <p className="mt-3 text-sm text-foreground/90">{day.description}</p>}
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      {day.activities?.length > 0 && (
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {day.activities.map((a, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      )}
                      {day.meals?.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Meals:</span> {day.meals.join(', ')}
                        </p>
                      )}
                    </div>
                    {(day.accommodation || day.notes) && (
                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        {day.accommodation && (
                          <p>
                            <span className="font-medium text-foreground">Stay:</span> {day.accommodation}
                          </p>
                        )}
                        {day.notes && <p>{day.notes}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inclusions / Exclusions */}
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <BulletList title="Inclusions" items={trip.inclusions} />
            <BulletList title="Exclusions" items={trip.exclusions} />
          </div>

          {/* Important information */}
          {trip.importantInformation && (
            <div className="mt-10">
              <h2 className="text-xl font-semibold">Important information</h2>
              <p className="mt-3 whitespace-pre-line text-sm text-foreground/90">
                {trip.importantInformation}
              </p>
            </div>
          )}

          {/* Reviews & ratings (approved only, verified bookings) */}
          <div className="mt-10">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden="true" />
              Ratings &amp; Reviews
            </h2>
            <div className="mt-4">
              <TripReviews trip={trip} />
            </div>
          </div>

          {/* FAQs - CMS-managed (trip → destination → global) */}
          <TripFaqs slug={trip.slug} name={trip.name} />

          {/* Gallery — polished Cloudinary lightbox */}
          <TripGallery heroImage={trip.heroImage} gallery={trip.gallery} tripName={trip.name} />

          {/* Gallery by Travelers — Photos/Videos tabs */}
          <TravelerGallery tripId={trip.id} tripName={trip.name} />

          {/* Related trips — same destination */}
          <RelatedTrips trip={trip} />
        </div>

        {/* Pricing summary. Departure-specific pricing/availability lives in
            the Upcoming departures section; this is the package fallback. */}
        <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-card lg:sticky lg:top-24">
          {cheapestBatch ? (
            <>
              <p className="text-sm text-muted-foreground">Starting at</p>
              <p className="mt-1 flex items-center text-3xl font-bold">
                <IndianRupee className="h-6 w-6" />
                {Number(cheapestBatch.price).toLocaleString('en-IN')}
                {cheapestBatch.originalPrice != null &&
                  Number(cheapestBatch.originalPrice) > Number(cheapestBatch.price) && (
                    <span className="ml-1.5 text-sm font-normal text-muted-foreground line-through">
                      ₹{Number(cheapestBatch.originalPrice).toLocaleString('en-IN')}
                    </span>
                  )}
              </p>
              {cheapestBatch.discountAmount != null && Number(cheapestBatch.discountAmount) > 0 ? (
                <p className="mt-0.5 text-xs font-medium text-primary">
                  ₹{Number(cheapestBatch.discountAmount).toLocaleString('en-IN')} Off · per person
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {cheapestBatch.currency || trip.currency} · per person
                </p>
              )}
            </>
          ) : hasPrice ? (
            <>
              <p className="text-sm text-muted-foreground">Starting at</p>
              <p className="mt-1 flex items-center text-3xl font-bold">
                <IndianRupee className="h-6 w-6" />
                {trip.startingPrice.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-muted-foreground">{trip.currency} · per person</p>
            </>
          ) : (
            <p className="text-muted-foreground">Price on request</p>
          )}

          {trip.maxGroupSize > 0 && (
            <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                Group size up to {trip.maxGroupSize}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                See upcoming departures below for dates and availability.
              </p>
            </div>
          )}

          {nextBatch ? (
            <div className="mt-6">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                Next departure
              </p>
              <p className="mt-0.5 text-lg font-semibold">
                {formatDateShort(nextBatch.departureDate)}
              </p>
              <p className="text-xs text-muted-foreground">
                {nextBatch.availableSeats > 0
                  ? `${nextBatch.availableSeats} seats available`
                  : 'Currently full'}
              </p>
              {nextBatch.availableSeats > 0 ? (
                <Link
                  to={`/booking/${trip.slug}?batch=${nextBatch.id}`}
                  className="mt-4 flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Book this departure
                </Link>
              ) : (
                <p className="mt-4 rounded-md border border-border bg-background px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">
                  Sold out — see other departures below
                </p>
              )}
            </div>
          ) : (
            !batchesQuery.isLoading &&
            !batchesQuery.isError && (
              <p className="mt-6 rounded-md border border-border bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground">
                No upcoming departures scheduled yet.
              </p>
            )
          )}

          {/* Custom-trip lead CTA — preselects the trip's destination. */}
          {trip.destination?.id && (
            <PlanTripTrigger
              destinationId={trip.destination.id}
              variant="outline"
              className="mt-4 w-full"
            >
              Plan Your Dream Trip
            </PlanTripTrigger>
          )}
        </aside>
      </div>
    </Container>
  )
}

function RelatedTrips({ trip }) {
  const { data, isLoading } = useQuery({
    queryKey: ['trips','related',trip.destination?.slug, trip.id],
    queryFn: () => tripApi.list({ destination: trip.destination?.slug, limit: 4, includeBatches: true }),
    enabled: !!trip.destination?.slug,
    staleTime: 60_000,
  })
  const related = (data?.data?.data?.items || []).filter(t => t.id !== trip.id).slice(0, 3)
  if (isLoading) return null
  if (related.length === 0) return null
  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">More trips in {trip.destination?.name}</h2>
        <Link to="/trips" className="text-sm font-medium text-primary hover:underline">View all trips</Link>
      </div>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.map(t => <TripCard key={t.id} trip={t} />)}
      </div>
    </div>
  )
}

function TripFaqs({ slug, name }) {
  const { data, isLoading } = useQuery({
    queryKey: ['faqs', 'trip', slug],
    queryFn: () => faqApi.listForTrip(slug),
    enabled: !!slug,
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="mt-10">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-24 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  const items = data?.data?.data?.items || []
  if (items.length === 0) return null

  return (
    <div className="mt-10">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <HelpCircle className="h-5 w-5 text-primary" />
        FAQs about {name}
      </h2>
      <div className="mt-4">
        <Accordion items={items} />
      </div>
    </div>
  )
}
