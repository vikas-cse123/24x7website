import * as React from 'react'
import { Link } from 'react-router-dom'
import { usePublicSettings } from '@/hooks/usePublicSettings'
import { isSafeBannerUrl, isExternalUrl } from '@/lib/settings'

// Full-width admin-controlled promotional banner. Rendered as the very first
// element of every public page (above the header). Driven by the centralized
// public settings API; an empty database falls back to the default config.
export function PromoBanner() {
  const { promotionalBanner } = usePublicSettings()

  const banner = promotionalBanner
  if (!banner.enabled) return null

  const ctaUrl = banner.ctaUrl
  // Button only renders when the admin saved BOTH text and a safe URL.
  const showCta = Boolean(String(banner.ctaText || '').trim()) && isSafeBannerUrl(ctaUrl)

  const style = {
    ...(banner.backgroundColor ? { backgroundColor: banner.backgroundColor } : {}),
    ...(banner.textColor ? { color: banner.textColor } : {}),
  }

  return (
    <div className="relative overflow-hidden bg-primary text-primary-foreground" style={style}>
      {banner.shimmerEnabled && <div className="banner-shimmer" aria-hidden="true" />}

      <div className="relative z-10 mx-auto flex min-h-10 w-full items-center justify-center gap-2 px-10 py-1.5 text-center text-xs font-medium sm:px-12 sm:text-sm">
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


      </div>
    </div>
  )
}