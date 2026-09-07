import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Container } from '@/components/ui/container'
import { destinationApi } from '@/services/destinations'
import { cn } from '@/lib/utils'
import { IndianFlagIcon } from '@/components/icons/IndianFlagIcon'
import { sortDestinationsForAll } from '@/lib/destinationImages'

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
      className="group flex flex-col items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="h-[210px] w-[165px] shrink-0 overflow-hidden rounded-full">
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
          <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-medium text-muted-foreground">
            <span className="px-2 text-center leading-tight">{name.slice(0, 2).toUpperCase()}</span>
          </div>
        )}
      </div>
      <p className="line-clamp-2 min-h-[2.4rem] w-[165px] break-words text-center text-[16px] font-medium leading-tight text-gray-900">
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

  // --- two-row drag scroll - butter smooth ---
  const trackRef = React.useRef(null)
  const isDraggingRef = React.useRef(false)
  const startXRef = React.useRef(0)
  const scrollLeftRef = React.useRef(0)
  const hasDraggedRef = React.useRef(false)
  const rafRef = React.useRef(null)
  const momentumRafRef = React.useRef(null)
  const lastXRef = React.useRef(0)
  const lastTimeRef = React.useRef(0)
  const velocityRef = React.useRef(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const [hasInteracted, setHasInteracted] = React.useState(false)
  React.useEffect(() => {
    setHasInteracted(false)
  }, [category])

  // Cleanup momentum on unmount / category change
  React.useEffect(() => {
    return () => {
      if (momentumRafRef.current) cancelAnimationFrame(momentumRafRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const onPointerDown = React.useCallback((e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    const el = trackRef.current
    if (!el) return
    // Stop any running momentum
    if (momentumRafRef.current) {
      cancelAnimationFrame(momentumRafRef.current)
      momentumRafRef.current = null
    }
    isDraggingRef.current = true
    hasDraggedRef.current = false
    velocityRef.current = 0
    lastXRef.current = e.clientX
    lastTimeRef.current = performance.now()
    setIsDragging(true)
    setHasInteracted(true)
    startXRef.current = e.clientX
    scrollLeftRef.current = el.scrollLeft
    el.style.scrollBehavior = 'auto'
    el.style.willChange = 'scroll-position'
  }, [])

  const onPointerMove = React.useCallback((e) => {
    if (!isDraggingRef.current || e.pointerType !== 'mouse') return
    e.preventDefault()
    const el = trackRef.current
    if (!el) return
    const x = e.clientX
    const now = performance.now()
    const dt = now - lastTimeRef.current
    if (dt > 0) {
      const dx = x - lastXRef.current
      velocityRef.current = velocityRef.current * 0.7 + (dx / dt) * 16 * 0.3
    }
    lastXRef.current = x
    lastTimeRef.current = now
    const walk = x - startXRef.current
    if (Math.abs(walk) > 5) hasDraggedRef.current = true
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      el.scrollLeft = scrollLeftRef.current - walk
    })
  }, [])

  const endDrag = React.useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    const el = trackRef.current
    if (el) {
      el.style.willChange = 'auto'
      const v = velocityRef.current
      if (Math.abs(v) > 2 && hasDraggedRef.current) {
        el.style.scrollBehavior = 'auto'
        let velocity = -v * 0.9
        const decay = 0.94
        const step = () => {
          if (!el || Math.abs(velocity) < 0.5) {
            el.style.scrollBehavior = 'smooth'
            if (el && el.scrollLeft <= 5) setHasInteracted(false)
            return
          }
          if ((velocity < 0 && el.scrollLeft <= 0) || (velocity > 0 && el.scrollLeft >= el.scrollWidth - el.clientWidth - 1)) {
            el.style.scrollBehavior = 'smooth'
            if (el.scrollLeft <= 5) setHasInteracted(false)
            return
          }
          el.scrollLeft += velocity
          velocity *= decay
          momentumRafRef.current = requestAnimationFrame(step)
        }
        momentumRafRef.current = requestAnimationFrame(step)
      } else {
        el.style.scrollBehavior = 'smooth'
        if (el.scrollLeft <= 5) setHasInteracted(false)
      }
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setTimeout(() => {
      hasDraggedRef.current = false
    }, 0)
  }, [])

  const onClickCapture = React.useCallback((e) => {
    if (hasDraggedRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  const onScroll = React.useCallback(() => {
    const el = trackRef.current
    if (!el) return
    // Don't toggle padding while actively dragging (avoids jump)
    if (isDraggingRef.current) return
    if (el.scrollLeft <= 5) {
      if (hasInteracted) setHasInteracted(false)
    } else if (!hasInteracted && el.scrollLeft > 5) {
      setHasInteracted(true)
    }
  }, [hasInteracted])

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
          <div className={cn('flex gap-8 overflow-hidden', !hasInteracted && 'px-5 sm:px-6 lg:px-[90px]')}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex shrink-0 flex-col items-center gap-2.5">
                <div className="h-[210px] w-[165px] animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              </div>
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
            onScroll={onScroll}
            className={cn(
              'grid grid-flow-col grid-rows-2 gap-8 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none touch-pan-x scroll-smooth transition-[padding] duration-200 ease-out',
              !hasInteracted && 'px-5 sm:px-6 lg:px-[90px]',
              hasInteracted && 'px-0',
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
            style={{ gridAutoColumns: 'max-content' }}
          >
              {destinations.map((d) => (
                <div key={d.id || d.slug} className="w-[165px] shrink-0 snap-start">
                  <DestinationOval destination={d} />
                </div>
              ))}
          </div>
        )}
      </div>
    </section>
  )
}
