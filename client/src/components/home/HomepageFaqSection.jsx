import { useQuery } from '@tanstack/react-query'
import { HelpCircle } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Accordion } from '@/components/ui/accordion'
import { faqApi } from '@/services/faqs'

export function HomepageFaqSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['faqs', 'global', { limit: 20 }],
    queryFn: () => faqApi.list({ limit: 20 }),
    staleTime: 60_000,
  })

  const faqs = data?.data?.data?.items || []

  return (
    <section className="py-12 lg:py-16">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2 className="flex items-center justify-center gap-2 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            <HelpCircle className="h-7 w-7 text-primary" />
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
            Everything you need to know before you travel with us.
          </p>
          <div className="mt-8">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : faqs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No frequently asked questions yet. Check back soon.
                </p>
              </div>
            ) : (
              <Accordion items={faqs} />
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
