import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Container } from '@/components/ui/container'
import { HorizontalCarousel } from '@/components/ui/horizontal-carousel'
import { destinationApi } from '@/services/destinations'
import { cn } from '@/lib/utils'
import { sortDestinationsForAll } from '@/lib/destinationImages'

const LIMIT = 50

const FILTERS = [
  { key: 'all', label: 'All', icon: '🌍' },
  { key: 'international', label: 'International', icon: '✈️' },
  { key: 'domestic', label: 'Domestic', icon: '🇮🇳' },
  { key: 'weekend', label: 'Weekend', icon: '🚗' },
]

function normalizeName(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function dedupeByName(destinations) {
  const seen = new Set()
  const out = []
  for (const d of destinations) {
    const key = normalizeName(d.name)
    if (!seen.has(key)) {
      seen.add(key)
      out.push(d)
    }
  }
  return out
}

function DestinationOval({ destination }) {
  const src =
    destination.homepageImage?.secureUrl ||
    destination.homepageImage?.url ||
    destination.heroImage?.secureUrl ||
    destination.heroImage?.url
  const name = destination.name
  const [imgError, setImgError] = React.useState(false)
  const showFallback = !src || imgError

  return (
    <Link
      to={`/destination/${destination.slug}`}
      className="group flex flex-col items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
    >
      <div className="h-[175px] w-[120px] shrink-0 overflow-hidden rounded-full sm:h-[185px] sm:w-[135px] lg:h-[190px] lg:w-[145px]">
        {!showFallback ? (
          <img
            src={src}
            alt={name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-medium text-muted-foreground">
            <span className="px-2 text-center leading-tight">{name.slice(0, 2).toUpperCase()}</span>
          </div>
        )}
      </div>
      <p className="line-clamp-2 min-h-[2.4rem] w-[120px] break-words text-center text-[14px] font-medium leading-tight text-gray-900 sm:w-[135px] sm:text-[15px] lg:w-[145px]">
        {name}
      </p>
    </Link>
  )
}

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

  let destinations = data?.data?.data?.items || []

  // Deduplicate by normalized name (slug is unique but name duplicated for Bali/Almaty/Spiti/Kashmir)
  destinations = dedupeByName(destinations)

  // For "All", use deliberate spec order; otherwise keep API order (displayOrder)
  if (category === 'all' && destinations.length > 0) {
    destinations = sortDestinationsForAll(destinations)
  }

  return (
    <section className="bg-white py-8 sm:py-10">
      <Container className="px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[26px]">Explore Destinations</h2>

        <div className="mt-4 flex flex-wrap gap-2.5">
          {FILTERS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setCategory(tab.key)}
              aria-pressed={category === tab.key}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                category === tab.key
                  ? 'border border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-300'
              )}
            >
              <span aria-hidden="true" className="text-[13px]">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-7">
          {isLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex shrink-0 flex-col items-center gap-2.5">
                  <div className="h-[175px] w-[120px] animate-pulse rounded-full bg-muted sm:h-[185px] sm:w-[135px] lg:h-[190px] lg:w-[145px]" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
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
            <HorizontalCarousel
              key={category}
              aria-label="Destinations"
              itemClassName="w-[120px] sm:w-[135px] lg:w-[145px]"
            >
              {destinations.map((d) => (
                <DestinationOval key={d.id || d.slug} destination={d} />
              ))}
            </HorizontalCarousel>
          )}
        </div>
      </Container>
    </section>
  )
}
