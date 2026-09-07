import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Container } from '@/components/ui/container'
import { HorizontalCarousel } from '@/components/ui/horizontal-carousel'
import { TripCard } from '@/components/trips/TripCard'
import { tripApi } from '@/services/trips'

const LIMIT = 30

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
      <Container className="max-w-none mx-0 w-full px-5 sm:px-6 lg:px-[90px]">
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
                <TripCard key={trip.id} trip={trip} />
              ))}
            </HorizontalCarousel>
          )}
        </div>
      </Container>
    </section>
  )
}
