import { Link } from 'react-router-dom'
import { CalendarDays, Clock3, ArrowRight, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { BLOG_CATEGORY_LABELS } from '@/schemas/blog'
import { formatDateLong } from '@/lib/dates'

// Reusable travel-blog card — reference hierarchy: cover → category/date/read
// time → title → excerpt → Read Now.
export function BlogCard({ blog }) {
  return (
    <Card className="group h-full overflow-hidden transition-shadow hover:shadow-card-hover focus-within:ring-2 focus-within:ring-ring">
      <Link to={`/blog/${blog.slug}`} className="block focus-visible:outline-none" aria-label={`${blog.title} — read now`}>
        <div className="relative aspect-[16/10]">
          <DestinationImage
            src={blog.coverImage?.url}
            alt={blog.coverImage?.alt || blog.title}
            className="h-full w-full"
          />
          {blog.category && (
            <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-0.5 text-xs font-medium text-foreground">
              {BLOG_CATEGORY_LABELS[blog.category] || blog.category}
            </span>
          )}
          {blog.featured && (
            <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              Featured
            </span>
          )}
        </div>

        <div className="p-4">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {formatDateLong(blog.publishedAt || blog.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {blog.readingTime} min read
            </span>
          </p>

          <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">
            {blog.title}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {blog.excerpt}
          </p>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            {blog.destination?.name ? (
              <span className="inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{blog.destination.name}</span>
              </span>
            ) : (
              <Badge variant="secondary">Guide</Badge>
            )}
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
              Read Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </Card>
  )
}
