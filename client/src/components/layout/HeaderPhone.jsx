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

// Solid filled handset icon (Font Awesome "phone" style).
function PhoneCallingIcon({ className }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z" />
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
        'inline-flex items-center gap-2 whitespace-nowrap text-[15px] font-bold leading-none text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      {/* leading-none on the anchor: the line box then hugs the digit ink, so
          items-center aligns the icon to the text's visual center instead of
          to leading/descent space (which left the icon reading ~2px high).
          top-px: the handset glyph is bottom-heavy, so it sits 1px low to read
          optically centered next to the digits. */}
      <PhoneCallingIcon className="relative top-px h-4 w-4 shrink-0 text-foreground" />
      <span>{display}</span>
    </a>
  )
}
