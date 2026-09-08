import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, Clock3, HelpCircle, MapPin, User } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { BlogCard } from '@/components/blogs/BlogCard'
import { BlogContentView } from '@/components/blogs/BlogContentView'
import { Accordion } from '@/components/ui/accordion'
import { blogApi } from '@/services/blogs'
import { BLOG_CATEGORY_LABELS } from '@/schemas/blog'
import { formatDateLong } from '@/lib/dates'
import { useSeo } from '@/lib/seo'

export function BlogDetailPage() {
  const { slug } = useParams()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['blogs', 'slug', slug],
    queryFn: () => blogApi.getBySlug(slug),
    retry: false,
  })

  const blog = data?.data?.data?.blog
  const related = data?.data?.data?.related || []

  useSeo({
    title: blog?.seoTitle || blog?.title,
    description: blog?.seoDescription || blog?.excerpt,
    canonical: `${window.location.origin}/blog/${slug}`,
    ogType: 'article',
    ogImage: blog?.coverImage?.url || undefined,
  })

  if (isLoading) {
    return (
      <Container className="py-10">
        <div className="mx-auto max-w-3xl">
          <div className="aspect-[16/8] animate-pulse rounded-2xl bg-muted" />
          <div className="mt-6 h-9 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </Container>
    )
  }

  if (isError || !blog) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold">Blog not found</h1>
        <p className="mt-2 text-muted-foreground">
          This article may have been unpublished or removed.
        </p>
        <Link to="/blogs">
          <Button className="mt-6">Browse travel blogs</Button>
        </Link>
      </Container>
    )
  }

  const dest = blog.destination

  return (
    <Container className="py-8 lg:py-12">
      <article className="mx-auto max-w-3xl">
        <Link
          to={dest ? `/blogs/${dest.slug}` : '/blogs'}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <ArrowLeft className="h-4 w-4" />
          {dest ? `More on ${dest.name}` : 'All travel blogs'}
        </Link>

        {/* Header */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {blog.category && (
            <Badge variant="secondary">{BLOG_CATEGORY_LABELS[blog.category] || blog.category}</Badge>
          )}
          {dest && (
            <Link to={`/blogs/${dest.slug}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
              <Badge variant="outline" className="gap-1 hover:bg-accent">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {dest.name}
              </Badge>
            </Link>
          )}
          {blog.featured && <Badge>Featured</Badge>}
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{blog.title}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-4 w-4 shrink-0" aria-hidden="true" />
            {blog.author}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
            {formatDateLong(blog.publishedAt || blog.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {blog.readingTime} min read
          </span>
        </div>

        {/* Cover */}
        <DestinationImage
          src={blog.coverImage?.url}
          alt={blog.coverImage?.alt || blog.title}
          className="mt-6 aspect-[16/8] w-full rounded-2xl"
        />

        {/* Tags — clickable filters */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Tags:</span>
            {blog.tags.map((t) => (
              <Link
                key={t}
                to={`/blogs?tag=${encodeURIComponent(t)}`}
                className="rounded-full border border-input bg-background px-3 py-1 text-xs font-medium hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}

        {/* Category filter link */}
        {blog.category && (
          <div className="mt-3">
            <Link
              to={`/blogs?category=${encodeURIComponent(blog.category)}`}
              className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              More in {BLOG_CATEGORY_LABELS[blog.category] || blog.category} →
            </Link>
          </div>
        )}

        {/* Article body */}
        <div className="mt-8">
          <BlogContentView blocks={blog.content} />
        </div>

        {/* FAQs — only when present, accordion style, mobile-friendly */}
        {Array.isArray(blog.faqs) && blog.faqs.length > 0 && (
          <section aria-label="Frequently asked questions" className="mt-12">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <HelpCircle className="h-5 w-5 text-primary" aria-hidden="true" />
              Frequently Asked Questions
            </h2>
            <div className="mt-4">
              <Accordion items={blog.faqs} />
            </div>
          </section>
        )}
      </article>

      {/* Related blogs */}
      {related.length > 0 && (
        <section aria-label="Related blogs" className="mx-auto mt-14 max-w-5xl border-t border-border pt-10">
          <h2 className="text-2xl font-bold tracking-tight">Related Blogs</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <BlogCard key={r.id} blog={r} />
            ))}
          </div>
        </section>
      )}
    </Container>
  )
}
