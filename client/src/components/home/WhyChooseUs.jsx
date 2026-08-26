import { Container } from '@/components/ui/container'
import { WHY_CHOOSE_US } from '@/lib/homeContent'

// "Why choose us" USP cards. Configurable via WHY_CHOOSE_US.
export function WhyChooseUs() {
  return (
    <section className="border-y border-border bg-muted/30 py-12 lg:py-16">
      <Container>
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Reasons To Travel With Us
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          What makes 24x7Chhutti trips different.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {WHY_CHOOSE_US.map((usp) => {
            const Icon = usp.icon
            return (
              <div
                key={usp.title}
                className="rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-muted text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{usp.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{usp.description}</p>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}