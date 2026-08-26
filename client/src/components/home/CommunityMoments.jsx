import { Camera } from 'lucide-react'
import { Container } from '@/components/ui/container'

// "Loved by Travellers Across India" — community / travel-moments section.
// No UGC media system exists yet, so this renders a clean placeholder. A future
// Media/UGC system will populate the grid.
export function CommunityMoments() {
  return (
    <section className="border-y border-border bg-muted/30 py-12 lg:py-16">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Camera className="h-3.5 w-3.5" />
            Travel moments
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Loved by Travellers Across India
          </h2>
          <p className="mt-2 text-muted-foreground">
            Real travel moments shared by our community will appear here soon.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Camera className="mx-auto h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">
            Community moments are coming soon.
          </p>
        </div>
      </Container>
    </section>
  )
}