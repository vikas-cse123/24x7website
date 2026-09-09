import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { destinationApi } from '@/services/destinations'

const PAGE_SIZE = 50
const COLUMN_COUNT = 5

async function fetchAllDestinations() {
  const first = await destinationApi.list({ page: 1, limit: PAGE_SIZE })
  const payload = first?.data?.data
  const items = [...(payload?.items || [])]
  const totalPages = payload?.totalPages || 1
  if (totalPages <= 1) return items
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      destinationApi.list({ page: i + 2, limit: PAGE_SIZE })
    )
  )
  for (const res of rest) items.push(...(res?.data?.data?.items || []))
  return items
}

function useFooterDestinations() {
  return useQuery({
    queryKey: ['footer', 'destinations'],
    queryFn: fetchAllDestinations,
    staleTime: 5 * 60 * 1000,
  })
}

function hasCategory(destination, key) {
  const category = destination?.category
  if (Array.isArray(category)) return category.includes(key)
  return category === key
}

function isValidDestination(destination) {
  if (!destination) return false
  if (!destination.slug || typeof destination.slug !== 'string') return false
  if (!destination.slug.trim()) return false
  if (!destination.name || !String(destination.name).trim()) return false
  // Public list API already returns published only; keep as a safeguard.
  if (destination.published === false) return false
  return true
}

function chunkIntoColumns(items, columnCount = COLUMN_COUNT) {
  const columns = Array.from({ length: columnCount }, () => [])
  if (items.length === 0) return columns
  const chunkSize = Math.ceil(items.length / columnCount)
  items.forEach((item, index) => {
    const columnIndex = Math.min(Math.floor(index / chunkSize), columnCount - 1)
    columns[columnIndex].push(item)
  })
  return columns.filter((column) => column.length > 0)
}

function getDestinationLabel(destination) {
  if (destination?.slug === 'almaty') return 'Almaty Tour Packages'
  return destination?.name
}

function DestinationLink({ destination }) {
  return (
    <Link
      to={`/destination/${destination.slug}`}
      className="text-[13px] leading-[1.4] text-[#374151] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {getDestinationLabel(destination)}
    </Link>
  )
}

function DestinationSectionSkeleton({ title, first }) {
  return (
    <section className={`hidden sm:block ${first ? '' : 'mt-8 lg:mt-10'}`} aria-label={`${title} loading`}>
      <h3 className="text-[15px] font-semibold leading-none tracking-tight text-[#1b4332]">{title}</h3>
      <div className="mt-3 border-t border-[#1b4332]/15 pt-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: COLUMN_COUNT }).map((_, columnIndex) => (
            <ul key={columnIndex} className="space-y-2" aria-hidden="true">
              {Array.from({ length: 3 }).map((__, itemIndex) => (
                <li key={itemIndex}>
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[#1b4332]/10" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  )
}

function DestinationSection({ title, destinations, first }) {
  const [open, setOpen] = React.useState(false)
  const columns = React.useMemo(
    () => chunkIntoColumns(destinations, COLUMN_COUNT),
    [destinations]
  )
  if (destinations.length === 0) return null
  return (
    <>
      {/* Desktop: grid */}
      <section className={`hidden sm:block ${first ? '' : 'mt-8 lg:mt-10'}`}>
        <h3 className="text-[15px] font-semibold leading-none tracking-tight text-[#1b4332]">{title}</h3>
        <div className="mt-3 border-t border-[#1b4332]/15 pt-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
            {columns.map((column, index) => (
              <ul key={index} className="space-y-2">
                {column.map((destination) => (
                  <li key={destination.slug}>
                    <DestinationLink destination={destination} />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </section>
      {/* Mobile: accordion */}
      <section className="sm:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between border-t border-[#1b4332]/15 py-4 text-left"
        >
          <span className="text-[15px] font-semibold tracking-tight text-[#1b4332]">{title}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-4 w-4 shrink-0 text-[#1b4332] transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {open && (
          <div className="pb-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-2">
              {destinations.map((destination) => (
                <div key={destination.slug}>
                  <DestinationLink destination={destination} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  )
}

export function FooterDestinations() {
  const { data, isLoading, isError } = useFooterDestinations()

  const destinations = React.useMemo(
    () => (data || []).filter(isValidDestination),
    [data]
  )
  const domesticDestinations = React.useMemo(
    () => destinations.filter((d) => hasCategory(d, 'domestic')),
    [destinations]
  )
  const internationalDestinations = React.useMemo(
    () => destinations.filter((d) => hasCategory(d, 'international')),
    [destinations]
  )

  if (isLoading) {
    return (
      <div>
        <DestinationSectionSkeleton title="Domestic Trips" first />
        <div className="hidden sm:block">
          <DestinationSectionSkeleton title="International Trips" />
        </div>
        {/* Mobile loading keeps the accordion chrome without fake links. */}
        <section className="sm:hidden" aria-label="Footer destinations loading">
          <div className="border-t border-[#1b4332]/15 py-4">
            <div className="h-4 w-32 animate-pulse rounded bg-[#1b4332]/10" />
          </div>
          <div className="border-t border-[#1b4332]/15 py-4">
            <div className="h-4 w-40 animate-pulse rounded bg-[#1b4332]/10" />
          </div>
        </section>
      </div>
    )
  }

  if (isError) return null

  return (
    <div>
      <DestinationSection
        title="Domestic Trips"
        destinations={domesticDestinations}
        first
      />
      <DestinationSection
        title="International Trips"
        destinations={internationalDestinations}
      />
    </div>
  )
}
