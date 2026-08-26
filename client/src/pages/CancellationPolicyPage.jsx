import { Link } from 'react-router-dom'
import { CalendarX, RefreshCcw, AlertTriangle } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { useSeo } from '@/lib/seo'

export function CancellationPolicyPage() {
  useSeo({
    title: 'Cancellation Policy',
    description: 'Cancellation, rescheduling and refund policy for 24x7Chhutti group trips.',
    canonical: `${window.location.origin}/cancellation-policy`,
  })
  return (
    <Container className="py-10 lg:py-14">
      <nav aria-label="Breadcrumb" className="mx-auto max-w-3xl text-sm text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li><Link to="/" className="hover:text-foreground hover:underline">Home</Link></li>
          <li aria-hidden="true" className="text-muted-foreground/60">/</li>
          <li aria-current="page" className="font-medium text-foreground">Cancellation Policy</li>
        </ol>
      </nav>
      <div className="mx-auto mt-6 max-w-3xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary"><CalendarX className="h-3.5 w-3.5" /> Cancellation Policy</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Cancellation Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 26 August 2026 · 24x7Chhutti</p>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 mt-6 flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p><strong>Payments are currently postponed.</strong> No online payments or refunds are processed on this website at this time. The policy below describes how cancellations and rescheduling will work once bookings are payment-enabled.</p>
        </div>

        <div className="prose prose-sm sm:prose-base mt-8 max-w-none prose-headings:tracking-tight prose-a:text-primary">
          <p className="lead text-muted-foreground">We understand plans can change. Our cancellation and rescheduling terms are designed to be fair and transparent.</p>

          <h2>1. How to cancel</h2>
          <p>You can cancel a booking from <Link to="/account/bookings">My Bookings</Link> in your account, or by contacting support with your booking code. Cancellation is available only for bookings in cancellable states (such as pending or confirmed) and is subject to the timelines below.</p>

          <h2>2. Cancellation timelines</h2>
          <p>Cancellation charges, if applicable once payments are enabled, will depend on how close the cancellation is to the departure date. Exact charges will be displayed on the trip and booking pages and confirmed before you cancel.</p>
          <ul>
            <li><strong>Well in advance:</strong> Lower or no charges; rescheduling may be free.</li>
            <li><strong>Closer to departure:</strong> Higher charges as stays and transport may already be reserved.</li>
            <li><strong>On or after departure:</strong> Generally non-refundable.</li>
          </ul>
          <p>Refer to the specific trip page or your booking confirmation for the precise schedule that applies to your trip.</p>

          <h2>3. Rescheduling</h2>
          <p>Where seats are available, we offer free or low-cost rescheduling to another departure of the same trip within the validity period. This is subject to availability and any difference in price between batches. Contact support to request a date change.</p>

          <h2>4. Operator cancellations</h2>
          <p>If we must cancel or reschedule a departure due to weather, safety, government restrictions or operational reasons, we will offer you an alternative departure or a credit for a future trip, as applicable once payments are enabled. We will communicate changes promptly.</p>

          <h2>5. No-shows</h2>
          <p>If you do not join the trip on the departure date without prior cancellation, the booking will be considered a no-show and will be non-refundable.</p>

          <h2>6. How refunds will work (when payments are enabled)</h2>
          <p>When online payments go live, eligible refunds will be processed to the original payment method within a reasonable timeframe and will exclude non-refundable third-party costs where applicable. Refund status will be visible in your account.</p>

          <h2>7. Need help?</h2>
          <p>Contact our 24×7 support team via the <Link to="/contact">contact page</Link> with your booking code and we will guide you.</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><RefreshCcw className="h-4 w-4 text-primary" /> Free rescheduling</p>
            <p className="mt-1 text-sm text-muted-foreground">Switch to another departure where seats are available.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><CalendarX className="h-4 w-4 text-primary" /> Transparent terms</p>
            <p className="mt-1 text-sm text-muted-foreground">Exact charges shown before you confirm cancellation.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6 text-sm">
          <Link to="/privacy-policy" className="font-medium text-primary hover:underline">Privacy Policy</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/terms-and-conditions" className="font-medium text-primary hover:underline">Terms & Conditions</Link>
        </div>
      </div>
    </Container>
  )
}
