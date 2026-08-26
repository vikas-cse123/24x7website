import * as React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, AtSign, Globe, Share2, Send } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Logo } from '@/components/brand/Logo'
import { FOOTER_NAV } from '@/lib/nav'

// Social links are placeholders (no profiles exist yet). Brand icons were
// removed from lucide-react, so generic icons represent each channel.
const SOCIALS = [
  { label: 'Facebook', href: '#', Icon: Share2 },
  { label: 'Instagram', href: '#', Icon: AtSign },
  { label: 'YouTube', href: '#', Icon: Globe },
]

function FooterLink({ href, children }) {
  return (
    <Link
      to={href}
      className="text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  )
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
        {title}
      </h3>
      <ul className="mt-3 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <FooterLink href={link.href}>{link.label}</FooterLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand + contact */}
          <div>
            <Logo imgClassName="h-11" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              24x7Chhutti — travel packages with departure dates, itineraries and
              pricing. Group and customised trips, available around the clock.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>Customer support available 24x7</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>Email support coming soon</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>India</span>
              </li>
            </ul>
          </div>

          <FooterColumn title="Destinations" links={FOOTER_NAV.destinations} />
          <FooterColumn title="Support" links={FOOTER_NAV.support} />
          <FooterColumn title="Policies" links={FOOTER_NAV.legal} />
        </div>

        {/* Newsletter — visual only for now */}
        <div className="mt-12 flex flex-col gap-4 rounded-xl border border-border bg-background p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold">Get trip updates</h3>
            <p className="text-sm text-muted-foreground">
              Newsletter signup will be available soon.
            </p>
          </div>
          <form
            className="flex w-full max-w-md items-center gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Your email address"
              className="h-10 flex-1 rounded-full border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} 24x7Chhutti. All rights reserved.</p>
          <div className="flex items-center gap-3">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  )
}
