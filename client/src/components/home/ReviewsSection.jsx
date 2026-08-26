import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Star, Quote } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Card } from '@/components/ui/card'
import httpClient from '@/services/http'

function Stars({ value }) {
  return (
    <span className="flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i<=Math.round(value||0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} aria-hidden="true" />
      ))}
    </span>
  )
}

export function ReviewsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['home','reviews','recent'],
    queryFn: async () => (await httpClient.get('/reviews/recent', { params: { limit: 3 } })).data?.data,
    staleTime: 60_000,
  })
  const reviews = data?.items || []

  return (
    <section className="border-y border-border bg-muted/30 py-12 lg:py-16">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Star className="h-3.5 w-3.5" />
            Traveller reviews
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Reviews From Our Travellers</h2>
          <p className="mt-2 text-muted-foreground">Verified reviews from travellers who booked and went.</p>
        </div>

        {isLoading ? (
          <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Quote className="mx-auto h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">Be the first to share your experience.</p>
          </div>
        ) : (
          <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map(r => (
              <Card key={r.id} className="flex flex-col p-5">
                <Stars value={r.rating} />
                <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-foreground/85">“{r.text}”</p>
                <div className="mt-4 flex items-center gap-2.5 border-t border-border pt-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                    {(r.travellerName||r.authorName||'T').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.travellerName || r.authorName}</p>
                    {r.trip?.name && (
                      <Link to={`/trip/${r.trip.slug}`} className="truncate text-xs text-primary hover:underline">{r.trip.name}</Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
