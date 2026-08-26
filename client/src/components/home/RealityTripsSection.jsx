import { Play } from 'lucide-react'
import { Container } from '@/components/ui/container'

// "The Reality Of A Trip" — video/travel-story section. No 24x7Chhutti video
// assets exist yet, so this renders a clean placeholder. A future video/media
// system will populate the video grid.
export function RealityTripsSection() {
  return (
    <section className="border-y border-border bg-muted/30 py-12 lg:py-16">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            The Reality Of A Trip
          </h2>
          <p className="mt-2 text-muted-foreground">
            Real stories, unfiltered moments and honest reviews from our
            community. Videos are coming soon.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Play className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm text-muted-foreground">
            Trip videos are coming soon.
          </p>
        </div>
      </Container>
    </section>
  )
}