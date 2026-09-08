import * as React from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronLeft, ChevronRight, Newspaper } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { BlogCard } from '@/components/blogs/BlogCard'
import { blogApi } from '@/services/blogs'
import { BLOG_CATEGORIES, BLOG_CATEGORY_LABELS } from '@/schemas/blog'
import { useSeo } from '@/lib/seo'

const PAGE_SIZE = 9

// Shared listing body for /blogs and /blogs/:destinationSlug.
export function BlogsListing({ destinationSlug = null, heading, intro }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const tag = searchParams.get('tag') || ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const [searchInput, setSearchInput] = React.useState(search)
  React.useEffect(() => setSearchInput(search), [search])
  React.useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim()
      if (next !== search) setParams({ search: next || null })
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  function setParams(patch) {
    const next = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '' ) next.delete(k)
      else next.set(k, String(v))
    }
    // Pagination resets on filter change; page change preserves filters.
    if (!('page' in patch)) next.delete('page')
    setSearchParams(next)
  }

  function setPage(n) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(n))
    setSearchParams(next)
  }

  useSeo({
    title: destinationSlug ? `Travel Blogs` : 'Travel Blogs & Guides',
    description:
      'Travel guides, things to do, trekking notes and local tips from the 24x7Chhutti community.',
    // Canonical always points at the unfiltered section root to avoid duplicate
    // indexable filter combinations.
    canonical: `${window.location.origin}${destinationSlug ? `/blogs/${destinationSlug}` : '/blogs'}`,
  })

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['blogs', { page, limit: PAGE_SIZE, search: search || undefined, category: category || undefined, tag: tag || undefined, destination: destinationSlug || undefined }],
    queryFn: () =>
      destinationSlug
        ? blogApi.listByDestination(destinationSlug, {
            page,
            limit: PAGE_SIZE,
            ...(search ? { search } : {}),
            ...(category ? { category } : {}),
            ...(tag ? { tag } : {}),
          })
        : blogApi.list({
            page,
            limit: PAGE_SIZE,
            ...(search ? { search } : {}),
            ...(category ? { category } : {}),
            ...(tag ? { tag } : {}),
          }),
    placeholderData: (prev) => prev,
  })

  const result = data?.data?.data
  const items = result?.items || []

  const { data: availableCategoriesData } = useQuery({
    queryKey: ['blogs', 'available-categories', destinationSlug || 'all'],
    queryFn: async () => {
      const results = await Promise.all(
        BLOG_CATEGORIES.map(async (c) => {
          try {
            const res = destinationSlug
              ? await blogApi.listByDestination(destinationSlug, { category: c, limit: 1 })
              : await blogApi.list({ category: c, limit: 1 })
            const total = res?.data?.data?.total ?? 0
            return { category: c, total }
          } catch {
            return { category: c, total: 0 }
          }
        })
      )
      return results.filter((r) => r.total > 0).map((r) => r.category)
    },
    staleTime: 5 * 60 * 1000,
  })
  const visibleCategories = availableCategoriesData ?? []
  const isCategoriesLoading = availableCategoriesData === undefined

  return (
    <Container className="py-8 lg:py-12">
      {/* Heading / hero */}
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{heading}</h1>
        <p className="mt-2 text-muted-foreground">{intro}</p>
      </div>

      {/* Search */}
      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative mt-6 max-w-md">
        <label htmlFor="blog-search" className="sr-only">
          Search travel blogs
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id="blog-search"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search blogs, places, tags…"
          className="h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </form>

      {/* Category pills - only categories that have at least one blog */}
      <div
        role="group"
        aria-label="Filter blogs by category"
        className="mt-5 -mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          onClick={() => setParams({ category: null })}
          aria-pressed={!category}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            !category
              ? 'bg-primary text-primary-foreground'
              : 'border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          All
        </button>
        {isCategoriesLoading
          ? BLOG_CATEGORIES.slice(0, 3).map((c) => (
              <div key={c} className="h-8 w-24 shrink-0 animate-pulse rounded-full bg-muted" />
            ))
          : visibleCategories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setParams({ category: category === c ? null : c })}
                aria-pressed={category === c}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  category === c
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {BLOG_CATEGORY_LABELS[c]}
              </button>
            ))}
      </div>



      {/* Active filter chips */}
      {(category || tag || search) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {category && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-3 py-1 text-xs font-medium">
              Category: {BLOG_CATEGORY_LABELS[category] || category}
              <button type="button" onClick={() => setParams({ category: null })} aria-label="Clear category" className="ml-1 rounded-full p-0.5 hover:bg-muted">×</button>
            </span>
          )}
          {tag && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-3 py-1 text-xs font-medium">
              Tag: {tag}
              <button type="button" onClick={() => setParams({ tag: null })} aria-label="Clear tag" className="ml-1 rounded-full p-0.5 hover:bg-muted">×</button>
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-3 py-1 text-xs font-medium">
              Search: {search}
              <button type="button" onClick={() => setParams({ search: null })} aria-label="Clear search" className="ml-1 rounded-full p-0.5 hover:bg-muted">×</button>
            </span>
          )}
          <button type="button" onClick={() => setParams({ search: null, category: null, tag: null })} className="text-xs font-medium text-primary hover:underline">
            Clear all
          </button>
        </div>
      )}

      {!isLoading && result && (
        <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">
          {result.total} article{result.total === 1 ? '' : 's'}
          {destinationSlug && result.destination ? ` in ${result.destination.name}` : ''}
          {category ? ` · ${BLOG_CATEGORY_LABELS[category] || category}` : ''}
          {tag ? ` · tag "${tag}"` : ''}
        </p>
      )}

      {isLoading ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border">
              <div className="aspect-[16/10] animate-pulse bg-muted" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <p role="alert" className="mt-6 rounded-xl border border-destructive/40 p-10 text-center text-sm text-destructive">
          Could not load blogs. {error?.message || 'Please try again.'}
        </p>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-14 text-center">
          <Newspaper className="mx-auto h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
          <p className="mt-3 text-lg font-medium">No blogs found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || category || tag
              ? 'Try a different search, category or tag.'
              : 'New travel stories are on the way — check back soon.'}
          </p>
          {(search || category || tag) && (
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => setParams({ search: null, category: null, tag: null })}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={`mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${data.isFetching ? 'opacity-60' : ''}`}>
            {items.map((b) => (
              <BlogCard key={b.id} blog={b} />
            ))}
          </div>

          {result.totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={result.page <= 1}
                onClick={() => setPage(result.page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              {Array.from({ length: result.totalPages }).map((_, i) => {
                const n = i + 1
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    aria-current={n === result.page ? 'page' : undefined}
                    aria-label={`Page ${n}`}
                    className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      n === result.page
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-input bg-background hover:bg-accent'
                    }`}
                  >
                    {n}
                  </button>
                )
              })}
              <Button
                variant="outline"
                size="icon"
                disabled={result.page >= result.totalPages}
                onClick={() => setPage(result.page + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </nav>
          )}
        </>
      )}
    </Container>
  )
}

export function BlogsPage() {
  return (
    <BlogsListing
      heading="Travel Blogs"
      intro="Guides, tips and stories from the road — written by travellers who have been there."
    />
  )
}

// /blogs/:destinationSlug — only published blogs belonging to that destination.
export function DestinationBlogsPage() {
  const { destinationSlug } = useParams()
  return (
    <BlogsListing
      key={destinationSlug}
      destinationSlug={destinationSlug}
      heading="Destination Travel Blogs"
      intro="Stories and guides from this destination."
    />
  )
}
