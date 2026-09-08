import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Container } from '@/components/ui/container'
import { cn } from '@/lib/utils'
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

  // Same proven mobile drag as Explore Destinations — smooth, momentum, no snap jump
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
      try { el.setPointerCapture(e.pointerId) } catch {}
    }
    if (lockRef.current === 'v') return
    if (e.cancelable) e.preventDefault()
    el.scrollLeft = scrollLeftRef.current - walkX
  }, [])

  const endDrag = React.useCallback((e) => {
    lockRef.current = null
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    const el = trackRef.current
    if (el) el.style.willChange = 'auto'
    try { if (e && e.pointerId != null) trackRef.current?.releasePointerCapture(e.pointerId) } catch {}
    if (el) el.style.scrollBehavior = 'smooth'
    setTimeout(() => { hasDraggedRef.current = false }, 0)
  }, [])

  const onClickCapture = React.useCallback((e) => {
    if (hasDraggedRef.current) { e.preventDefault(); e.stopPropagation() }
  }, [])

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
        <div className="mt-5 -mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
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
            <div
              ref={trackRef}
              role="region"
              aria-label="Upcoming group trips"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              onPointerCancel={endDrag}
              onClickCapture={onClickCapture}
              className={cn(
                'flex gap-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden touch-pan-y scroll-smooth',
                isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
              )}
            >
              {trips.map((trip) => (
                <div key={trip.id} className="w-[88vw] max-w-[360px] shrink-0 snap-start sm:w-[380px] lg:w-[340px]">
                  <TripCard trip={trip} />
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
