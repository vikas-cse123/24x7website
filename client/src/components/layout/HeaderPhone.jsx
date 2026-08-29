import * as React from 'react'
import { Phone } from 'lucide-react'
import { usePublicSettings } from '@/hooks/usePublicSettings'
import { cn } from '@/lib/utils'

// Header phone number, admin-controlled (Contact Information settings).
// Renders nothing when no number is configured or the admin hides it.
export function HeaderPhone({ className }) {
  const { contact } = usePublicSettings()

  if (!contact.showPhoneInHeader || !contact.phone) return null

  const tel = contact.phone.replace(/[\s()-]/g, '')

  return (
    <a
      href={`tel:${tel}`}
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span>{contact.phone}</span>
    </a>
  )
}