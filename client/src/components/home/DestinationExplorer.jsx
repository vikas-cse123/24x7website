import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Container } from '@/components/ui/container'
import { destinationApi } from '@/services/destinations'
import { cn } from '@/lib/utils'
import { IndianFlagIcon } from '@/components/icons/IndianFlagIcon'

const LIMIT = 50

const FILTERS = [
  { key: 'all', label: 'All', icon: '🌍' },
  { key: 'international', label: 'International', icon: '✈️' },
  { key: 'domestic', label: 'Domestic', icon: <IndianFlagIcon className="h-4 w-4" /> },
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
  const name = destination.homepageName || destination.name
  const [imgError, setImgError] = React.useState(false)
  const showFallback = !src || imgError

  return (
    <Link
      to={`/destination/${destination.slug}`}
      className="group flex flex-col items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl sm:gap-2"
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-full sm:h-[96px] sm:w-[96px] lg:h-[210px] lg:w-[165px]">
        {!showFallback ? (
          <img
            src={src}
            alt={name}
            loading="lazy"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] pointer-events-none select-none"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-[11px] font-medium text-muted-foreground sm:text-xs">
            <span className="px-2 text-center leading-tight">{name.slice(0, 2).toUpperCase()}</span>
          </div>
        )}
      </div>
      <p className="line-clamp-2 min-h-[2.2rem] w-[88px] break-words text-center text-[13px] font-medium leading-tight text-gray-900 sm:min-h-[2.4rem] sm:w-[96px] sm:text-[14px] lg:w-[165px] lg:text-[16px]">
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

  // Deduplicate by normalized name (slug is unique but name duplicated for Bali/Almaty/Spiti/Kashmir).
  // Ordering comes from the API (displayOrder ASC, then name): filtering and
  // sorting both happen server-side so every filter shares one global ranking.
  destinations = dedupeByName(destinations)

  // Native-feeling horizontal scroll: overflow-x-auto + 1:1 pointer drag
  // No momentum RAF, no velocity, no wheel hijack, no snap.
  const trackRef = React.useRef(null)
  const isDraggingRef = React.useRef(false)
  const startXRef = React.useRef(0)
  const startYRef = React.useRef(0)
  const scrollLeftRef = React.useRef(0)
  const hasDraggedRef = React.useRef(false)
  const lockRef = React.useRef(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const onPointerDown = React.useCallback((e) => {
    if (e.button !== 0) return
    const el = trackRef.current
    if (!el) return
    hasDraggedRef.current = false
    lockRef.current = null
    startXRef.current = e.clientX
    startYRef.current = e.clientY
    scrollLeftRef.current = el.scrollLeft
  }, [])

  const onPointerMove = React.useCallback((e) => {
    const el = trackRef.current
    if (!el) return
    const walkX = e.clientX - startXRef.current
    const walkY = e.clientY - startYRef.current
    if (!isDraggingRef.current) {
      if (Math.abs(walkX) < 6 && Math.abs(walkY) < 6) return
      if (!lockRef.current) lockRef.current = Math.abs(walkX) > Math.abs(walkY) ? 'h' : 'v'
      if (lockRef.current === 'v') return
      if (Math.abs(walkX) <= 6) return
      isDraggingRef.current = true
      hasDraggedRef.current = true
      setIsDragging(true)
      el.style.scrollBehavior = 'auto'
      el.style.willChange = 'scroll-position'
      try {
        el.setPointerCapture(e.pointerId)
      } catch {}
    }
    if (lockRef.current === 'v') return
    if (e.cancelable) e.preventDefault()
    el.scrollLeft = scrollLeftRef.current - walkX
  }, [])

  const endDrag = React.useCallback(
    (e) => {
      lockRef.current = null
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      setIsDragging(false)
      const el = trackRef.current
      if (el) el.style.willChange = 'auto'
      try {
        if (e && e.pointerId != null) trackRef.current?.releasePointerCapture(e.pointerId)
      } catch {}
      if (el) el.style.scrollBehavior = 'smooth'
      if (hasDraggedRef.current) {
        setTimeout(() => {
          hasDraggedRef.current = false
        }, 0)
      }
    },
    []
  )

  const onClickCapture = React.useCallback((e) => {
    if (hasDraggedRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  return (
    <section className="bg-white py-8 sm:py-10">
      <Container className="max-w-none mx-0 w-full px-5 sm:px-6 lg:px-[90px]">
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
              <span aria-hidden="true" className="inline-flex items-center text-[13px]">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </Container>

      <div className="mt-7">
        {isLoading ? (
          <div className="flex gap-4 overflow-hidden px-5 sm:gap-6 sm:px-6 lg:gap-8 lg:px-[90px]">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-[84px] w-[84px] shrink-0 rounded-full skeleton sm:h-[96px] sm:w-[96px] lg:h-[210px] lg:w-[165px]" />
            ))}
          </div>
        ) : isError ? (
          <p className="mx-5 rounded-xl border border-destructive/40 p-8 text-center text-sm text-destructive sm:mx-6 lg:mx-[90px]">
            Could not load destinations.
          </p>
        ) : destinations.length === 0 ? (
          <p className="mx-5 rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground sm:mx-6 lg:mx-[90px]">
            No destinations available yet.
          </p>
        ) : (
          <div
            key={category}
            ref={trackRef}
            role="region"
            aria-label="Destinations"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            onPointerCancel={endDrag}
            onClickCapture={onClickCapture}
            className={cn(
              'grid grid-flow-col grid-rows-2 gap-4 overflow-x-auto overscroll-x-contain px-5 pb-2 [scrollbar-width:none] sm:gap-6 sm:px-6 lg:gap-8 lg:px-[90px] [&::-webkit-scrollbar]:hidden touch-pan-y scroll-smooth',
              isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
            )}
            style={{ gridAutoColumns: 'max-content' }}
          >
              {destinations.map((d) => (
                <div key={d.id || d.slug} className="w-[88px] shrink-0 sm:w-[96px] lg:w-[165px]">
                  <DestinationOval destination={d} />
                </div>
              ))}
          </div>
        )}
      </div>
    </section>
  )
}
