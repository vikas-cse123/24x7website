import * as React from 'react'
import { Phone, Mail, Map } from 'lucide-react'
import { FaWhatsapp, FaInstagram, FaFacebookF } from 'react-icons/fa'
import { Container } from '@/components/ui/container'
import {
  FOOTER_CONTACT,
  FOOTER_SOCIALS,
} from '@/lib/footerData'

// Brand glyphs are not shipped with lucide-react, so the social row uses small
// inline SVGs. Stroke style matches the existing lucide icon language; the X
// glyph is a solid mark by design.
function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4V9h4v1a6 6 0 0 1 2-2z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 2H22l-7.03 8.03L23.27 22h-6.53l-5.11-6.68L5.79 22H2.66l7.52-8.6L1.4 2h6.7l4.62 6.11L18.9 2zm-1.15 18.2h1.72L7.05 3.7H5.2L17.75 20.2z" />
    </svg>
  )
}

function YouTubeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  )
}

const SOCIAL_ICONS = {
  WhatsApp: FaWhatsapp,
  Instagram: FaInstagram,
  Facebook: FaFacebookF,
  LinkedIn: LinkedInIcon,
  X: XIcon,
  YouTube: YouTubeIcon,
}

function Heading({ children }) {
  return <h3 className="text-[15px] font-semibold leading-none tracking-tight text-[#1b4332]">{children}</h3>
}

function AddressBlock({ company, address, children }) {
  return (
    <div className="mt-4">
      <p className="text-[13px] font-medium leading-tight text-[#1f2937]">{company}</p>
      <p className="mt-1.5 max-w-xs text-[13px] leading-[1.5] text-[#4b5563]">
        {address}
      </p>
      {children}
    </div>
  )
}

function FooterAccordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <div className="border-t border-[#1b4332]/15 sm:border-t-0 sm:py-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left sm:hidden"
      >
        <span className="text-[15px] font-semibold tracking-tight text-[#1b4332]">{title}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-4 w-4 shrink-0 text-[#1b4332] transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className="hidden sm:block">
        <Heading>{title}</Heading>
        <div className="mt-4">{children}</div>
      </div>
      {open && <div className="pb-4 pt-2 sm:hidden">{children}</div>}
    </div>
  )
}

export function FooterInfo() {
  const { delhi, support } = FOOTER_CONTACT
  return (
    <Container className="max-w-none mx-0 w-full px-5 sm:px-6 lg:px-[90px]">
      {/* Mobile accordion, Desktop grid */}
      <div className="sm:hidden">
        <FooterAccordion title="Address">
          <AddressBlock company={delhi.company} address={delhi.address}>
            <a
              href="https://maps.app.goo.gl/NPn8DfeDYZCwJYmH9"
              target="_blank"
              rel="noreferrer"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#1b4332]/30 px-3.5 py-1.5 text-xs font-medium text-[#1b4332] transition-colors hover:bg-[#1b4332]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Map className="h-3.5 w-3.5" />
              View on Map
            </a>
          </AddressBlock>
        </FooterAccordion>
        <FooterAccordion title="Talk To Us">
          <ul className="space-y-2.5 text-[13px] leading-[1.4] text-[#374151]">
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <a href={support.phone.href} className="transition-colors hover:text-primary">
                {support.phone.label}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <a href={support.email.href} className="transition-colors hover:text-primary">
                {support.email.label}
              </a>
            </li>
          </ul>
        </FooterAccordion>
        <div className="border-t border-[#1b4332]/15 py-4">
          <h3 className="text-[15px] font-semibold tracking-tight text-[#1b4332]">Follow us on</h3>
          <div className="mt-4 flex items-center gap-5">
            {FOOTER_SOCIALS.map(({ label, href }) => {
              const Icon = SOCIAL_ICONS[label]
              return (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex text-[#374151] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Icon ? <Icon className="h-[18px] w-[18px]" /> : null}
                </a>
              )
            })}
          </div>
        </div>
      </div>

      <div className="hidden gap-10 py-10 sm:grid sm:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr] lg:gap-12">
        {/* Address */}
        <div>
          <Heading>Address</Heading>
          <AddressBlock company={delhi.company} address={delhi.address}>
            <a
              href="https://maps.app.goo.gl/NPn8DfeDYZCwJYmH9"
              target="_blank"
              rel="noreferrer"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#1b4332]/30 px-3.5 py-1.5 text-xs font-medium text-[#1b4332] transition-colors hover:bg-[#1b4332]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Map className="h-3.5 w-3.5" />
              View on Map
            </a>
          </AddressBlock>
        </div>

        {/* Talk To Us + socials */}
        <div>
          <Heading>Talk To Us</Heading>
          <ul className="mt-4 space-y-2.5 text-[13px] leading-[1.4] text-[#374151]">
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <a href={support.phone.href} className="transition-colors hover:text-primary">
                {support.phone.label}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <a href={support.email.href} className="transition-colors hover:text-primary">
                {support.email.label}
              </a>
            </li>
          </ul>

          <h3 className="mt-8 text-base font-semibold text-[#1b4332]">
            Follow us on
          </h3>
          <div className="mt-4 flex items-center gap-5">
            {FOOTER_SOCIALS.map(({ label, href }) => {
              const Icon = SOCIAL_ICONS[label]
              return (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex text-[#374151] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Icon ? <Icon className="h-[18px] w-[18px]" /> : null}
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </Container>
  )
}
