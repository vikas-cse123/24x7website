import * as React from 'react'
import { Link } from 'react-router-dom'
import { Megaphone, X } from 'lucide-react'
import { usePublicSettings } from '@/hooks/usePublicSettings'
import { isSafeBannerUrl, isExternalUrl } from '@/lib/settings'

// Session-scoped dismissal key: closing hides the banner for THIS browser
// session only — it never changes the global admin setting.
const DISMISS_KEY = 'chhutti:promo-banner-dismissed'

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function writeDismissed() {
  try {
    sessionStorage.setItem(DISMISS_KEY, '1')
  } catch {
    // private mode / storage unavailable — dismissal simply won't persist
  }
}

// Full-width admin-controlled promotional banner. Rendered as the very first
// element of every public page (above the header). Driven by the centralized
// public settings API; an empty database falls back to the default config.
export function PromoBanner() {
  const { promotionalBanner } = usePublicSettings()
  const [dismissed, setDismissed] = React.useState(readDismissed)

  const banner = promotionalBanner
  if (!banner.enabled || dismissed) return null

  const ctaUrl = banner.ctaUrl || '/trips'
  const showCta = isSafeBannerUrl(ctaUrl)

  const style = {
    ...(banner.backgroundColor ? { backgroundColor: banner.backgroundColor } : {}),
    ...(banner.textColor ? { color: banner.textColor } : {}),
  }

  return (
    <div className="relative overflow-hidden bg-primary text-primary-foreground" style={style}>
      {banner.shimmerEnabled && <div className="banner-shimmer" aria-hidden="true" />}

      <div className="relative z-10 mx-auto flex min-h-10 w-full items-center justify-center gap-2 px-10 py-1.5 text-center text-xs font-medium sm:px-12 sm:text-sm">
        <Megaphone className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden="true" />
        <span className="min-w-0 truncate">{banner.message}</span>
        {showCta &&
          (isExternalUrl(ctaUrl) ? (
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded font-semibold underline underline-offset-2 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {banner.ctaText}
            </a>
          ) : (
            <Link
              to={ctaUrl}
              className="shrink-0 rounded font-semibold underline underline-offset-2 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {banner.ctaText}
            </Link>
          ))}

        {banner.dismissible && (
          <button
            type="button"
            onClick={() => {
              writeDismissed()
              setDismissed(true)
            }}
            aria-label="Dismiss announcement"
            className="absolute right-1.5 top-1/2 z-10 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition-colors hover:bg-primary-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:right-2"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}