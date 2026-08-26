import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { IndianRupee, ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { destinationApi } from '@/services/destinations'

const LIMIT = 12

export function TrendingDestinations() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['home', 'trending-destinations'],
    queryFn: () => destinationApi.list({ limit: LIMIT }),
  })

  const destinations = data?.data?.data?.items || []

  return (
    <section className="py-12 lg:py-16">
      <Container>
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-muted" />
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {destinations.map((d) => (
                <TrendingDestinationCard key={d.id} destination={d} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}

export function TrendingDestinationCard({ destination }) {
  const hasPrice = destination.startingPrice !== null && destination.startingPrice !== undefined

  return (
    <Link
      to={`/destination/${destination.slug}`}
      className="group block overflow-hidden rounded-xl shadow-card transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <DestinationImage
        src={destination.heroImage?.url}
        alt={destination.heroImage?.alt || destination.name}
        className="aspect-[4/5] w-full"
      />
      <div className="bg-card p-3">
        <h3 className="truncate text-sm font-semibold group-hover:text-primary">
          {destination.name}
        </h3>
        {hasPrice ? (
          <p className="mt-0.5 flex items-center text-sm text-muted-foreground">
            <span className="mr-1 text-xs">Starting</span>
            <IndianRupee className="h-3.5 w-3.5" />
            {destination.startingPrice.toLocaleString('en-IN')}
          </p>
        ) : (
          <p className="mt-0.5 flex items-center text-sm text-muted-foreground">
            View destination
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </p>
        )}
      </div>
    </Link>
  )
}