import * as React from 'react'
import { Phone } from 'lucide-react'
import { usePublicSettings } from '@/hooks/usePublicSettings'
import { cn } from '@/lib/utils'

// Normalize an admin-entered phone for safe `tel:` linking: keep digits and a
// leading `+` only, so dialing never breaks from spaces/dashes/parens.
function toTel(value) {
  return (value || '').replace(/[^\d+]/g, '')
}

// Strip a leading +91 (or 91) from a phone if present, so we never end up
// displaying a duplicated country code like "+91 +91 …".
function stripCountryCode(value) {
  return (value || '').replace(/^(\+?91)?[\s-]*/, '')
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
  const display = showCode ? `+91 ${bare}` : contact.phone
  const tel = showCode ? `+91${toTel(bare)}` : toTel(contact.phone)

  return (
    <a
      href={`tel:${tel}`}
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <Phone className="h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
      <span>{display}</span>
    </a>
  )
}