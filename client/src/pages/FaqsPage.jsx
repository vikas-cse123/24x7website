import { useQuery } from '@tanstack/react-query'
import { HelpCircle } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Accordion } from '@/components/ui/accordion'
import { faqApi } from '@/services/faqs'
import { useSeo } from '@/lib/seo'

export function FaqsPage() {
  useSeo({ title: 'Frequently Asked Questions', description: 'Answers to common questions about 24x7Chhutti group trips, booking and travel.' })
  const { data, isLoading } = useQuery({
    queryKey: ['faqs','global',{ limit: 50 }],
    queryFn: () => faqApi.list({ limit: 50 }),
  })
  const faqs = data?.data?.data?.items || []
  return (
    <Container className="py-10 lg:py-14">
      <div className="mx-auto max-w-3xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
          <HelpCircle className="h-3.5 w-3.5" /> Frequently Asked Questions
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">FAQs</h1>
        <p className="mt-2 text-muted-foreground">Everything you need to know before you travel with us.</p>
        <div className="mt-8">
          {isLoading ? (
            <div className="space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-16 animate-pulse rounded-xl bg-muted"/> )}</div>
          ) : faqs.length===0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">No FAQs yet. Check back soon.</div>
          ) : <Accordion items={faqs} />}
        </div>
      </div>
    </Container>
  )
}
