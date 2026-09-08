import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as React from 'react'
import { Container } from '@/components/ui/container'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { destinationApi } from '@/services/destinations'
import { tripApi } from '@/services/trips'

const LIMIT = 12
const TRIPS_LIMIT = 50

export function TrendingDestinations() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['home', 'trending-destinations', { featured: true }],
    queryFn: () => destinationApi.list({ limit: LIMIT, featured: 'true' }),
  })

  const { data: tripsData } = useQuery({
    queryKey: ['home', 'trending-destinations', 'trips-prices', { limit: TRIPS_LIMIT }],
    queryFn: () => tripApi.list({ limit: TRIPS_LIMIT }),
    staleTime: 60_000,
  })

  // Handle actual API shape: axios response → response.data → { success, data: { items } }
  // Some interceptors may unwrap one level, so support all shapes.
  const destinations =
    data?.data?.data?.items ?? data?.data?.items ?? data?.items ?? []
  const trips =
    tripsData?.data?.data?.items ?? tripsData?.data?.items ?? tripsData?.items ?? []

  const priceMap = React.useMemo(() => {
    const map = new Map()
    for (const trip of trips) {
      const destId = trip.destination?.id || trip.destinationId
      if (!destId) continue
      const price = Number(trip.startingPrice)
      if (!price || Number.isNaN(price) || price <= 0) continue
      const existing = map.get(destId)
      if (existing == null || price < existing) map.set(destId, price)
    }
    return map
  }, [trips])

  return (
    <section className="py-12 lg:py-16">
      <Container className="max-w-none mx-0 w-full px-5 sm:px-6 lg:px-[90px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Trending Destinations</h2>
          <Link
            to="/destinations"
            className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            View all destinations
          </Link>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton relative overflow-hidden rounded-[16px] aspect-[3/4]"
                  aria-hidden="true"
                >
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="skeleton h-4 w-3/4 rounded bg-white/40" />
                    <div className="mt-2 skeleton h-3 w-1/2 rounded bg-white/30" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <p className="rounded-xl border border-destructive/40 p-8 text-center text-sm text-destructive">
              Could not load destinations.
            </p>
          ) : destinations.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
              No destinations available yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
              {destinations.map((d) => {
                const cheapest = priceMap.get(d.id)
                return <TrendingDestinationCard key={d.id} destination={d} cheapestPrice={cheapest} />
              })}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}

export function TrendingDestinationCard({ destination, cheapestPrice }) {
  const imgSrc = destination.homepageImage?.url || destination.homepageImage?.secureUrl || null
  const imgAlt = destination.homepageImage?.alt || destination.name
  const hasPrice = cheapestPrice != null && cheapestPrice > 0

  return (
    <Link
      to={`/destination/${destination.slug}`}
      className="group relative block overflow-hidden rounded-[16px] bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`${destination.name} — view destination`}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[16px]">
        {imgSrc ? (
          <DestinationImage
            src={imgSrc}
            alt={imgAlt}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-muted-foreground">
            No image
          </div>
        )}
        {/* Dark gradient for text readability */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" aria-hidden="true" />
        {/* Text overlay bottom-left */}
        <div className="absolute inset-x-0 bottom-0 p-[14px] sm:p-4">
          <h3 className="truncate text-[15px] font-semibold leading-tight text-white drop-shadow-sm sm:text-[16px]">
            {destination.name}
          </h3>
          {hasPrice ? (
            <p className="mt-1 text-[13px] font-medium leading-none text-white/95 drop-shadow-sm sm:text-[13px]">
              Starting ₹{Number(cheapestPrice).toLocaleString('en-IN')}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
