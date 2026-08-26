import { Link } from 'react-router-dom'
import { Shield, FileText } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { useSeo } from '@/lib/seo'

export function PrivacyPolicyPage() {
  useSeo({
    title: 'Privacy Policy',
    description: 'Privacy Policy for 24x7Chhutti — how we collect, use and protect your information.',
    canonical: `${window.location.origin}/privacy-policy`,
  })
  return (
    <Container className="py-10 lg:py-14">
      <nav aria-label="Breadcrumb" className="mx-auto max-w-3xl text-sm text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li><Link to="/" className="hover:text-foreground hover:underline">Home</Link></li>
          <li aria-hidden="true" className="text-muted-foreground/60">/</li>
          <li aria-current="page" className="font-medium text-foreground">Privacy Policy</li>
        </ol>
      </nav>
      <div className="mx-auto mt-6 max-w-3xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary"><Shield className="h-3.5 w-3.5" /> Privacy Policy</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 26 August 2026 · 24x7Chhutti</p>

        <div className="prose prose-sm sm:prose-base mt-8 max-w-none prose-headings:tracking-tight prose-a:text-primary">
          <p className="lead text-muted-foreground">This Privacy Policy describes how 24x7Chhutti collects, uses and protects your personal information when you use our website and services.</p>

          <h2>1. Information we collect</h2>
          <p>We collect information you provide directly — such as your name, email address, phone number and traveller details when you create an account, make a booking or contact us. We also collect limited technical information such as device and usage data to improve our services.</p>
          <ul>
            <li><strong>Account information:</strong> name, email, mobile number (used for authentication), profile preferences.</li>
            <li><strong>Booking information:</strong> traveller names, contact details, trip and batch selection.</li>
            <li><strong>Communications:</strong> messages you send via our contact forms or support channels.</li>
            <li><strong>Usage data:</strong> pages visited, search queries and interactions that help us improve discovery.</li>
          </ul>

          <h2>2. How we use your information</h2>
          <ul>
            <li>To provide and manage trips, bookings and customer support.</li>
            <li>To authenticate your account and keep it secure.</li>
            <li>To communicate booking confirmations, updates and important notices.</li>
            <li>To improve our website, content and travel recommendations.</li>
            <li>To comply with legal obligations.</li>
          </ul>

          <h2>3. Sharing and disclosure</h2>
          <p>We do not sell your personal information. We may share it only with trusted partners needed to fulfil your booking (for example stays or transport providers) and service providers that help us operate the website, all bound by confidentiality. We may also disclose information when required by law.</p>

          <h2>4. Cookies</h2>
          <p>We use essential cookies to keep you signed in and to remember preferences. You can control cookies through your browser settings; disabling essential cookies may affect functionality such as login and booking.</p>

          <h2>5. Data retention</h2>
          <p>We retain your information for as long as your account is active or as needed to provide services and comply with legal obligations. You may request deletion of your account data by contacting us.</p>

          <h2>6. Security</h2>
          <p>We apply reasonable technical and organisational measures to protect your data. No system is perfectly secure, so we encourage you to use a strong, unique password and keep your login details private.</p>

          <h2>7. Your rights</h2>
          <p>Depending on your location, you may have rights to access, correct or delete your personal data, and to object to certain processing. Contact us to exercise these rights.</p>

          <h2>8. Children</h2>
          <p>Our services are intended for users who can legally enter into bookings. Traveller details for minors must be provided by a parent or guardian.</p>

          <h2>9. Contact us</h2>
          <p>If you have questions about this policy, please <Link to="/contact">contact us</Link>. We will respond as promptly as possible.</p>

          <h2>10. Changes to this policy</h2>
          <p>We may update this Privacy Policy from time to time. We will post the updated version on this page and update the date above.</p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 border-t border-border pt-6 text-sm">
          <Link to="/terms-and-conditions" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"><FileText className="h-4 w-4" /> Terms & Conditions</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/cancellation-policy" className="font-medium text-primary hover:underline">Cancellation Policy</Link>
        </div>
      </div>
    </Container>
  )
}
