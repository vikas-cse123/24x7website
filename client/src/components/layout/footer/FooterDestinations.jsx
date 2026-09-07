import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { destinationApi } from '@/services/destinations'
import {
  DOMESTIC_TRIP_COLUMNS,
  INTERNATIONAL_TRIP_COLUMNS,
} from '@/lib/footerData'

// Labels like "Kashmir Tour Packages" → "kashmir" so they can be matched
// against destination names/slugs coming from the API.
function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/tour\s*packages?/g, '')
    .replace(/[^a-z0-9]/g, '')
}

const PAGE_SIZE = 50

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

function useDestinationSlugMap() {
  const { data } = useQuery({
    queryKey: ['footer', 'destination-slugs'],
    queryFn: fetchAllDestinations,
    staleTime: 5 * 60 * 1000,
  })
  return React.useMemo(() => {
    const map = new Map()
    for (const destination of data || []) {
      if (destination?.slug) {
        if (destination.name) map.set(normalize(destination.name), destination.slug)
        map.set(normalize(destination.slug), destination.slug)
      }
    }
    return map
  }, [data])
}

function DestinationLink({ label, category, slugMap }) {
  const slug = slugMap.get(normalize(label))
  const to = slug ? `/destination/${slug}` : `/trips?category=${category}`
  return (
    <Link
      to={to}
      className="text-[13px] leading-[1.4] text-[#374151] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {label}
    </Link>
  )
}

function DestinationSection({ title, columns, category, first }) {
  const slugMap = useDestinationSlugMap()
  return (
    <section className={first ? '' : 'mt-8 lg:mt-10'}>
      <h3 className="text-[15px] font-semibold leading-none tracking-tight text-[#1b4332]">{title}</h3>
      <div className="mt-3 border-t border-[#1b4332]/15 pt-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
          {columns.map((column, index) => (
            <ul key={index} className="space-y-2">
              {column.map((label) => (
                <li key={label}>
                  <DestinationLink label={label} category={category} slugMap={slugMap} />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FooterDestinations() {
  return (
    <div>
      <DestinationSection
        title="Domestic Trips"
        columns={DOMESTIC_TRIP_COLUMNS}
        category="domestic"
        first
      />
      <DestinationSection
        title="International Trips"
        columns={INTERNATIONAL_TRIP_COLUMNS}
        category="international"
      />
    </div>
  )
}
