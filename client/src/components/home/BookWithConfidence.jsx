import { Container } from '@/components/ui/container'
import { CONFIDENCE_BENEFITS } from '@/lib/homeContent'

// "Book with Confidence" benefit cards. Configurable via CONFIDENCE_BENEFITS.
export function BookWithConfidence() {
  return (
    <section className="py-12 lg:py-16">
      <Container>
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Book with Confidence
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          Simple, flexible and safe ways to book your trip.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CONFIDENCE_BENEFITS.map((benefit) => {
            const Icon = benefit.icon
            return (
              <div
                key={benefit.title}
                className="rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-muted text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{benefit.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}