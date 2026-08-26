import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Container } from '@/components/ui/container'
import { HorizontalCarousel } from '@/components/ui/horizontal-carousel'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { destinationApi } from '@/services/destinations'
import { DESTINATION_CATEGORY_TABS } from '@/lib/homeContent'
import { cn } from '@/lib/utils'

const LIMIT = 30

export function DestinationExplorer() {
  const [category, setCategory] = React.useState('all')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['home', 'destinations', category],
    queryFn: () =>
      destinationApi.list({
        limit: LIMIT,
        category: category === 'all' ? undefined : category,
      }),
  })

  const destinations = data?.data?.data?.items || []

  return (
    <section className="py-12 lg:py-16">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Explore Destinations</h2>
          <Link
            to="/destinations"
            className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            View all destinations
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {DESTINATION_CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setCategory(tab.key)}
              aria-pressed={category === tab.key}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                category === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
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
              Could not load destinations.
            </p>
          ) : destinations.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
              No destinations available yet.
            </p>
          ) : (
            <HorizontalCarousel
              aria-label="Destinations"
              itemClassName="w-40 sm:w-44 lg:w-52"
            >
              {destinations.map((d) => (
                <DestinationTile key={d.id} destination={d} />
              ))}
            </HorizontalCarousel>
          )}
        </div>
      </Container>
    </section>
  )
}

function DestinationTile({ destination }) {
  return (
    <Link
      to={`/destination/${destination.slug}`}
      className="group block overflow-hidden rounded-xl shadow-card transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <DestinationImage
        image={destination.heroImage}
        alt={destination.heroImage?.alt || destination.name}
        className="aspect-[4/5] w-full"
      />
      <p className="truncate bg-card px-3 py-2.5 text-center text-sm font-medium text-foreground group-hover:text-primary">
        {destination.name}
      </p>
    </Link>
  )
}