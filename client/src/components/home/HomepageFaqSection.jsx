import { Accordion } from '@/components/ui/accordion'
import { Container } from '@/components/ui/container'
import { HOMEPAGE_FAQS } from '@/lib/homeContent'

// "Frequently Asked Questions" — reference-style block: full-width light-gray
// rounded container, left-aligned heading, divider-row accordion (single-open,
// first item open). Content comes from HOMEPAGE_FAQS; the full admin-managed
// FAQ list still lives on the /faqs page.
export function HomepageFaqSection() {
  return (
    <section aria-label="Frequently asked questions" className="bg-background py-12 lg:py-16">
      <Container>
        <div className="rounded-2xl bg-[#F5F5F5] p-6 sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <Accordion
            items={HOMEPAGE_FAQS}
            className="mt-4 rounded-2xl border-0 bg-transparent divide-gray-300/70"
          />
        </div>
      </Container>
    </section>
  )
}
