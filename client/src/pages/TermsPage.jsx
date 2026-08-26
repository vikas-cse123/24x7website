import { Link } from 'react-router-dom'
import { Scale, Shield } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { useSeo } from '@/lib/seo'

export function TermsPage() {
  useSeo({
    title: 'Terms & Conditions',
    description: 'Terms & Conditions for using 24x7Chhutti — booking, payments, conduct and liability.',
    canonical: `${window.location.origin}/terms-and-conditions`,
  })
  return (
    <Container className="py-10 lg:py-14">
      <nav aria-label="Breadcrumb" className="mx-auto max-w-3xl text-sm text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li><Link to="/" className="hover:text-foreground hover:underline">Home</Link></li>
          <li aria-hidden="true" className="text-muted-foreground/60">/</li>
          <li aria-current="page" className="font-medium text-foreground">Terms & Conditions</li>
        </ol>
      </nav>
      <div className="mx-auto mt-6 max-w-3xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary"><Scale className="h-3.5 w-3.5" /> Terms & Conditions</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Terms & Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 26 August 2026 · 24x7Chhutti</p>

        <div className="prose prose-sm sm:prose-base mt-8 max-w-none prose-headings:tracking-tight prose-a:text-primary">
          <p className="lead text-muted-foreground">These Terms & Conditions govern your use of the 24x7Chhutti website and services. By using our website or making a booking, you agree to these terms.</p>

          <h2>1. About us</h2>
          <p>24x7Chhutti provides group and customised travel packages with published itineraries, departure batches and transparent pricing. We operate in India and work with verified accommodation and transport partners.</p>

          <h2>2. Eligibility</h2>
          <p>You must be at least 18 years old to create an account and make a booking. Traveller details for minors must be provided by a parent or legal guardian who accepts these terms on their behalf.</p>

          <h2>3. Bookings and payments</h2>
          <ul>
            <li>All bookings are subject to availability of the selected departure batch. Seats are confirmed only after successful booking creation and seat reservation.</li>
            <li>Prices, inclusions and exclusions are displayed on each trip page. Prices may change until a booking is confirmed.</li>
            <li>Payment is processed as described at checkout. Where instalments or EMI are offered, terms are shown before you confirm.</li>
            <li>We may cancel or reschedule a departure due to operational or safety reasons; in such cases options offered will follow our <Link to="/cancellation-policy">Cancellation Policy</Link>.</li>
          </ul>

          <h2>4. Traveller information</h2>
          <p>You are responsible for ensuring traveller names, contact details and identity documents are accurate. Incorrect information may affect your booking or travel.</p>

          <h2>5. Conduct on trips</h2>
          <p>Travellers are expected to follow the instructions of trip captains, respect local laws and customs, and behave considerately toward fellow travellers and hosts. We may remove a traveller from a trip for serious misconduct without refund where safety is at risk.</p>

          <h2>6. Content and intellectual property</h2>
          <p>All website content — including text, images, logos and itineraries — is owned by or licensed to 24x7Chhutti. You may not copy, reproduce or redistribute content without permission, except for personal, non-commercial reference.</p>

          <h2>7. Reviews and user content</h2>
          <p>By submitting a review or other content, you confirm it is your own experience and you grant us a non-exclusive licence to display it. We moderate reviews and may remove content that is inappropriate or misleading.</p>

          <h2>8. Limitation of liability</h2>
          <p>To the fullest extent permitted by law, our liability is limited to the amount you paid for the affected booking. We are not liable for indirect or consequential losses, or for events beyond our reasonable control such as weather, political unrest or third-party failures.</p>

          <h2>9. Changes to services</h2>
          <p>We may update trip information, pricing and website features from time to time. Material changes to these terms will be posted on this page.</p>

          <h2>10. Governing law</h2>
          <p>These terms are governed by the laws of India. Any disputes will be subject to the jurisdiction of competent courts in India.</p>

          <h2>11. Contact</h2>
          <p>Questions about these terms? <Link to="/contact">Contact us</Link> and our team will assist.</p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 border-t border-border pt-6 text-sm">
          <Link to="/privacy-policy" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"><Shield className="h-4 w-4" /> Privacy Policy</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/cancellation-policy" className="font-medium text-primary hover:underline">Cancellation Policy</Link>
        </div>
      </div>
    </Container>
  )
}
