import { Sparkles, ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { PlanTripTrigger } from '@/components/enquiry/PlanTripTrigger'

// Homepage custom-trip lead CTA — opens the "Plan Your Dream Trip" modal.
export function PlanTripCta() {
  return (
    <section className="py-12 lg:py-16">
      <Container>
        <div className="rounded-2xl bg-gradient-to-br from-brand-muted via-background to-muted/40 p-6 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Custom trips
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Planning something different?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Tell us your dates, budget and travel style — we'll craft a custom
              itinerary around you.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <PlanTripTrigger className="gap-2" size="lg">
                Plan Your Dream Trip
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </PlanTripTrigger>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}