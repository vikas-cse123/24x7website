import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { cn } from '@/lib/utils'
import { BlogCard } from '@/components/blogs/BlogCard'
import { blogApi } from '@/services/blogs'

// Homepage "Related Blogs" — real published articles from the Blog system.
export function RelatedBlogs() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['home', 'blogs'],
    queryFn: () => blogApi.list({ limit: 6 }),
    staleTime: 60_000,
  })

  const blogs = data?.data?.data?.items || []

  // Same proven mobile drag as Explore Destinations
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
    <section className="pt-12 pb-0 lg:py-16">
      <Container className="max-w-none mx-0 w-full px-5 sm:px-6 lg:px-[90px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Travel Blogs</h2>
            <p className="mt-1.5 text-muted-foreground">
              Guides, tips and stories from the road.
            </p>
          </div>
          {!isLoading && !isError && blogs.length > 0 && (
            <Link
              to="/blogs"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Read All
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        <div className="mt-5 sm:mt-6">
          {isLoading ? (
            <div className="flex gap-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-y scroll-smooth">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-[88vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-xl border border-border sm:w-[360px] lg:w-[340px]">
                  <div className="aspect-[16/10] skeleton" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-24 rounded skeleton" />
                    <div className="h-4 w-full rounded skeleton" />
                    <div className="h-4 w-2/3 rounded skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <p role="alert" className="rounded-xl border border-destructive/40 p-8 text-center text-sm text-destructive">
              Could not load blogs.
            </p>
          ) : blogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Travel stories are on the way — check back soon.
              </p>
            </div>
          ) : (
            <div
              ref={trackRef}
              role="region"
              aria-label="Travel blogs"
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
              {blogs.map((b) => (
                <div key={b.id} className="w-[88vw] max-w-[340px] shrink-0 snap-start sm:w-[360px] lg:w-[340px]">
                  <BlogCard blog={b} />
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
