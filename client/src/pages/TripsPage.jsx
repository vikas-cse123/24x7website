import * as React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { TripCard } from '@/components/trips/TripCard'
import { TripDestinationTabs } from '@/components/trips/TripDestinationTabs'
import { TripFilterPanel } from '@/components/trips/TripFilterPanel'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { tripApi } from '@/services/trips'
import { TRIP_TYPE_LABELS } from '@/schemas/trip'
import { formatDateLong } from '@/lib/dates'
import { useSeo } from '@/lib/seo'

const PAGE_SIZE = 12
const DEFAULT_SORT = 'recommended'

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'departure_asc', label: 'Departure: Soonest' },
]

// Every discovery filter lives in the URL so views are shareable,
// refresh-safe and back/forward friendly. `null`/'' means absent.
const PARAMS = [
  'search',
  'destination',
  'tripType',
  'category',
  'minPrice',
  'maxPrice',
  'departureDate',
  'departureFrom',
  'departureTo',
  'featured',
]

function readParams(searchParams) {
  const out = {}
  for (const key of PARAMS) {
    const v = searchParams.get(key)
    if (v !== null && v !== '') out[key] = v
  }
  return out
}

function priceChipLabel(minPrice, maxPrice) {
  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`
  if (minPrice && maxPrice) return `${fmt(minPrice)}–${fmt(maxPrice)}`
  if (maxPrice) return `Under ${fmt(maxPrice)}`
  return `From ${fmt(minPrice)}`
}

export function TripsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readParams(searchParams)
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const sort = searchParams.get('sort') || DEFAULT_SORT

  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const gridRef = React.useRef(null)

  // Debounced search input kept in sync with the URL (back/forward safe).
  const [searchInput, setSearchInput] = React.useState(filters.search || '')
  React.useEffect(() => {
    setSearchInput(filters.search || '')
  }, [filters.search])
  React.useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim()
      if (next !== (filters.search || '')) setFilters({ search: next || null })
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  function setFilters(patch) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === undefined || value === '') next.delete(key)
      else next.set(key, String(value))
    }
    next.delete('page') // any filter change resets pagination
    setSearchParams(next)
  }

  function setPage(nextPage) {
    const next = new URLSearchParams(searchParams)
    if (nextPage <= 1) next.delete('page')
    else next.set('page', String(nextPage))
    setSearchParams(next)
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function clearAll() {
    const next = new URLSearchParams()
    if (sort !== DEFAULT_SORT) next.set('sort', sort)
    setSearchParams(next)
  }

  const activeFilterCount = PARAMS.filter((k) => filters[k]).length

  useSeo({
    title: 'Group Trips & Tour Packages',
    description:
      'Browse upcoming group trips with real departure dates, per-departure pricing and availability. Filter by destination, budget, dates and travel style.',
    // Canonical always points at the unfiltered /trips view so filtered
    // combinations do not become duplicate indexable URLs (ADR-015).
    canonical: typeof window !== 'undefined' ? `${window.location.origin}/trips` : undefined,
  })

  // Destinations for tabs/selector: derived from real published trips so only
  // destinations that actually have trips appear (never hardcoded).
  const { data: tabData } = useQuery({
    queryKey: ['trips', { limit: 50 }],
    queryFn: () => tripApi.list({ limit: 50 }),
    staleTime: 60_000,
  })
  const destinations = React.useMemo(() => {
    const seen = new Map()
    ;(tabData?.data?.data?.items || []).forEach((t) => {
      if (t.destination && !seen.has(t.destination.slug)) {
        seen.set(t.destination.slug, { slug: t.destination.slug, name: t.destination.name })
      }
    })
    return [...seen.values()]
  }, [tabData])

  const queryParams = {
    page,
    limit: PAGE_SIZE,
    sort,
    includeBatches: true,
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.destination ? { destination: filters.destination } : {}),
    ...(filters.tripType ? { tripType: filters.tripType } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.featured ? { featured: true } : {}),
    ...(filters.minPrice ? { minPrice: Number(filters.minPrice) } : {}),
    ...(filters.maxPrice ? { maxPrice: Number(filters.maxPrice) } : {}),
    ...(filters.departureDate ? { departureDate: filters.departureDate } : {}),
    ...(filters.departureFrom ? { departureFrom: filters.departureFrom } : {}),
    ...(filters.departureTo ? { departureTo: filters.departureTo } : {}),
  }

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['trips', queryParams],
    queryFn: () => tripApi.list(queryParams),
    placeholderData: (prev) => prev,
  })

  const result = data?.data?.data
  const items = result?.items || []

  // Removable filter chips (real active filters only).
  const chips = []
  if (filters.search) chips.push({ key: 'search', label: `“${filters.search}”` })
  if (filters.destination) {
    const d = destinations.find((x) => x.slug === filters.destination)
    chips.push({ key: 'destination', label: d?.name || filters.destination })
  }
  if (filters.tripType)
    chips.push({ key: 'tripType', label: TRIP_TYPE_LABELS[filters.tripType] || filters.tripType })
  if (filters.category)
    chips.push({
      key: 'category',
      label: filters.category === 'domestic' ? 'Domestic' : filters.category === 'international' ? 'International' : filters.category,
    })
  if (filters.minPrice || filters.maxPrice)
    chips.push({ key: 'budget', label: priceChipLabel(filters.minPrice, filters.maxPrice) })
  if (filters.departureDate)
    chips.push({ key: 'departureDate', label: `Departing ${formatDateLong(filters.departureDate)}` })
  if (filters.departureFrom || filters.departureTo)
    chips.push({
      key: 'range',
      label: `Departures ${filters.departureFrom ? formatDateLong(filters.departureFrom) : '…'} – ${
        filters.departureTo ? formatDateLong(filters.departureTo) : '…'
      }`,
    })
  if (filters.featured) chips.push({ key: 'featured', label: 'Featured' })

  const removeChip = (key) => {
    if (key === 'budget') return setFilters({ minPrice: null, maxPrice: null })
    if (key === 'range') return setFilters({ departureFrom: null, departureTo: null })
    setFilters({ [key]: null })
  }

  const filterPanel = (idPrefix) => (
    <TripFilterPanel
      idPrefix={idPrefix}
      filters={filters}
      destinations={destinations}
      onChange={setFilters}
      onClear={clearAll}
    />
  )

  return (
    <Container className="py-8 lg:py-12">
      {/* Heading + intro */}
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Upcoming Group Trips</h1>
        <p className="mt-2 text-muted-foreground">
          Real departures with live pricing — pick a destination, a budget or a
          date, and find your next chhutti.
        </p>
      </div>

      {/* Category pills: Domestic / International */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {[
          { value: null, label: 'All Trips' },
          { value: 'domestic', label: 'Domestic Trips' },
          { value: 'international', label: 'International Trips' },
        ].map((opt) => {
          const active = (filters.category || null) === opt.value
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => setFilters({ category: opt.value })}
              aria-pressed={active}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Destination tabs (real destinations) */}
      <div className="mt-4">
        <TripDestinationTabs
          destinations={destinations}
          value={filters.destination || 'all'}
          onChange={(slug) => setFilters({ destination: slug === 'all' ? null : slug })}
        />
      </div>

      {/* Controls row: search, sort, mobile filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="relative min-w-0 flex-1 basis-64"
        >
          <label htmlFor="trip-search" className="sr-only">
            Search trips
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="trip-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search trips or destinations…"
            className="h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>

        <div className="flex items-center gap-2">
          <label htmlFor="trip-sort" className="sr-only">
            Sort trips
          </label>
          <Select
            id="trip-sort"
            value={sort}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams)
              if (e.target.value === DEFAULT_SORT) next.delete('sort')
              else next.set('sort', e.target.value)
              next.delete('page')
              setSearchParams(next)
            }}
            aria-label="Sort trips"
            className="h-10 w-auto min-w-[170px] rounded-full"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>

          {/* Mobile filters trigger */}
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-haspopup="dialog"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Active filter chips */}
      {(chips.length > 0 || activeFilterCount > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-2" aria-live="polite">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full bg-muted py-1 pl-3 pr-1.5 text-xs font-medium text-foreground"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => removeChip(chip.key)}
                aria-label={`Remove filter ${chip.label}`}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          {chips.length > 1 && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={clearAll}
              className="h-auto p-0 text-primary"
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Result count */}
      {!isLoading && !isError && result && (
        <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">
          {isFetching ? 'Updating results…' : `${result.total} ${result.total === 1 ? 'trip' : 'trips'} found`}
        </p>
      )}

      <div className="mt-4 grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Desktop filter sidebar */}
        <aside className="hidden h-fit rounded-xl border border-border bg-card p-5 shadow-card lg:block">
          {filterPanel('trip-filters')}
        </aside>

        {/* Results */}
        <section ref={gridRef} aria-label="Trip results" className="min-w-0 scroll-mt-24">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border">
                  <div className="aspect-[3/4] animate-pulse bg-muted" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-destructive/40 p-10 text-center">
              <p className="text-sm text-destructive">
                Could not load trips. {error?.message || 'Please try again.'}
              </p>
              <Button type="button" variant="outline" className="mt-4" onClick={() => refetch()}>
                <RotateCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-16 text-center">
              <p className="text-lg font-medium">No trips match your filters.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try widening your budget or clearing some filters.
              </p>
              <Button type="button" className="mt-5" onClick={clearAll}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className={`grid gap-6 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${isFetching ? 'opacity-60' : ''}`}>
                {items.map((t) => (
                  <TripCard key={t.id} trip={t} />
                ))}
              </div>

              {result.totalPages > 1 && (
                <nav
                  aria-label="Pagination"
                  className="mt-10 flex items-center justify-center gap-1.5"
                >
                  <button
                    type="button"
                    disabled={result.page <= 1}
                    onClick={() => setPage(result.page - 1)}
                    aria-label="Previous page"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  {Array.from({ length: result.totalPages }).map((_, i) => {
                    const n = i + 1
                    const isCurrent = n === result.page
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPage(n)}
                        aria-current={isCurrent ? 'page' : undefined}
                        aria-label={`Page ${n}`}
                        className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-input bg-background hover:bg-accent'
                        }`}
                      >
                        {n}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    disabled={result.page >= result.totalPages}
                    onClick={() => setPage(result.page + 1)}
                    aria-label="Next page"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>

      {/* Mobile filter drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent onClose={() => setDrawerOpen(false)} showClose={false} className="h-full">
          <div className="flex items-center justify-between border-b border-border p-4">
            <p className="text-base font-bold">Filters</p>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close filters"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{filterPanel('trip-filters-drawer')}</div>
          <div className="border-t border-border p-4">
            <Button type="button" className="w-full" onClick={() => setDrawerOpen(false)}>
              Show results
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cross-link back into destination discovery (CAT-style SEO/content area is
          intentionally minimal here; destination pages carry the long-form content). */}
      <div className="mt-14 rounded-xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        Looking for a specific place? Browse our{' '}
        <Link to="/destinations" className="font-medium text-primary hover:underline">
          destinations
        </Link>{' '}
        for country-level guides, or head back to the{' '}
        <Link to="/" className="font-medium text-primary hover:underline">
          homepage
        </Link>{' '}
        to explore what 24x7Chhutti is about.
      </div>
    </Container>
  )
}
