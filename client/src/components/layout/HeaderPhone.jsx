import * as React from 'react'
import { usePublicSettings } from '@/hooks/usePublicSettings'
import { cn } from '@/lib/utils'

// Normalize an admin-entered phone for safe `tel:` linking: keep digits and a
// leading `+` only, so dialing never breaks from spaces/dashes/parens.
function toTel(value) {
  return (value || '').replace(/[^\d+]/g, '')
}

// Strip an explicit "+91" prefix from a phone if present, so we never end up
// displaying a duplicated country code like "(+91) +91 …". A number that
// merely starts with 91 (e.g. 9167834595) is kept intact.
function stripCountryCode(value) {
  return (value || '').replace(/^\+91[\s-]*/, '')
}

// Solid filled handset icon (Material "call" style).
function PhoneCallingIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  )
}

// Header phone number, admin-controlled (Contact Information settings).
// Renders nothing when no number is configured or the admin hides it.
// When "Show +91 country code" is enabled, the code is prepended only for
// display (and for the tel: link); it is never persisted into the stored number.
export function HeaderPhone({ className }) {
  const { contact } = usePublicSettings()

  if (!contact.showPhoneInHeader || !contact.phone) return null

  const showCode = !!contact.showCountryCode
  const bare = stripCountryCode(contact.phone)
  const display = showCode ? `(+91) ${bare}` : contact.phone
  const tel = showCode ? `+91${toTel(bare)}` : toTel(contact.phone)

  return (
    <a
      href={`tel:${tel}`}
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap text-[15px] font-bold text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <PhoneCallingIcon className="h-5 w-5 shrink-0 text-foreground" />
      <span>{display}</span>
    </a>
  )
}
