import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Container } from '@/components/ui/container'
import { DestinationCard } from '@/components/destinations/DestinationCard'
import { destinationApi } from '@/services/destinations'
import { useSeo } from '@/lib/seo'
import { DESTINATION_CATEGORY_TABS } from '@/lib/homeContent'

const PAGE_SIZE = 12

export function DestinationsPage() {
  const [page, setPage] = React.useState(1)
  const [category, setCategory] = React.useState('all')

  useSeo({
    title: 'Destinations',
    description: 'Explore travel destinations with 24x7Chhutti.',
  })

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['destinations', { page, limit: PAGE_SIZE, category: category === 'all' ? undefined : category }],
    queryFn: () =>
      destinationApi.list({
        page,
        limit: PAGE_SIZE,
        ...(category === 'all' ? {} : { category }),
      }),
  })

  const result = data?.data?.data

  return (
    <Container className="py-10 lg:py-14">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Destinations</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Discover places to travel with 24x7Chhutti.
        </p>
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter destinations by category">
          {DESTINATION_CATEGORY_TABS.map(t => (
            <button key={t.key} type="button" onClick={()=>{ setCategory(t.key); setPage(1) }}
              aria-pressed={category===t.key}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${category===t.key ? 'bg-primary text-primary-foreground' : 'border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/40 p-10 text-center text-sm text-destructive">
          Could not load destinations. {error?.message || 'Please try again.'}
        </div>
      ) : result && result.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-16 text-center">
          <p className="text-lg font-medium">No destinations available yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon for new travel destinations.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((d) => (
              <DestinationCard key={d.id} destination={d} />
            ))}
          </div>

          {result.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {result.page} of {result.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= result.totalPages}
                onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </Container>
  )
}