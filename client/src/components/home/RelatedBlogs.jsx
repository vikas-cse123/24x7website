import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { HorizontalCarousel } from '@/components/ui/horizontal-carousel'
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

  return (
    <section className="py-12 lg:py-16">
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

        <div className="mt-6">
          {isLoading ? (
            <HorizontalCarousel aria-label="Loading travel blogs" itemClassName="w-[88vw] max-w-[340px] sm:w-[360px] lg:w-[340px]">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border">
                  <div className="aspect-[16/10] skeleton" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-24 rounded skeleton" />
                    <div className="h-4 w-full rounded skeleton" />
                    <div className="h-4 w-2/3 rounded skeleton" />
                  </div>
                </div>
              ))}
            </HorizontalCarousel>
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
            <HorizontalCarousel aria-label="Travel blogs" itemClassName="w-[88vw] max-w-[340px] sm:w-[360px] lg:w-[340px]">
              {blogs.map((b) => (
                <BlogCard key={b.id} blog={b} />
              ))}
            </HorizontalCarousel>
          )}
        </div>
      </Container>
    </section>
  )
}
