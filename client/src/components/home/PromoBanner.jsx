import * as React from 'react'
import { Link } from 'react-router-dom'
import { Megaphone, X } from 'lucide-react'
import { PROMO_BANNER_CONFIG } from '@/lib/homeContent'

// Top promotional/announcement bar. Configurable via PROMO_BANNER_CONFIG so a
// future CMS can control it. Dismissible when enabled.
export function PromoBanner() {
  const [dismissed, setDismissed] = React.useState(false)
  if (!PROMO_BANNER_CONFIG.enabled || dismissed) return null

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="container mx-auto flex items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium sm:text-sm">
        <Megaphone className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{PROMO_BANNER_CONFIG.text}</span>
        {PROMO_BANNER_CONFIG.ctaHref && (
          <Link
            to={PROMO_BANNER_CONFIG.ctaHref}
            className="shrink-0 underline underline-offset-2 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {PROMO_BANNER_CONFIG.ctaLabel}
          </Link>
        )}
        {PROMO_BANNER_CONFIG.dismissible && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss announcement"
            className="absolute right-3 inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-primary-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}