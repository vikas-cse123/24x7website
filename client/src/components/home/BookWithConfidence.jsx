import { Container } from '@/components/ui/container'
import { CONFIDENCE_BENEFITS } from '@/lib/homeContent'

// "Book with Confidence" — full-width cream strip matching the reference
// design: centered heading, five icon + bold single-line benefits laid out
// 3 + 2 (second row centered), "T&C applied*" note bottom-right.
// Configurable via CONFIDENCE_BENEFITS.
export function BookWithConfidence() {
  return (
    <section className="bg-[#FFFCE1]">
      <Container className="py-10 lg:py-12">
        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Book with Confidence
        </h2>

        <div className="mt-10 flex flex-wrap justify-center gap-y-10">
          {CONFIDENCE_BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="flex w-full items-center justify-center gap-3 px-4 sm:w-1/3"
            >
              <span aria-hidden="true" className="shrink-0 text-[40px] leading-none">
                {benefit.icon}
              </span>
              <p className="max-w-[240px] text-base font-bold leading-snug text-gray-900">
                {benefit.title}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-right text-xs text-muted-foreground">T&amp;C applied*</p>
      </Container>
    </section>
  )
}
