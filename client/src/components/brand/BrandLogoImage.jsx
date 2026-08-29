import * as React from 'react'
import { cn } from '@/lib/utils'
import { useBranding } from '@/hooks/useBranding'
import { BRAND_LOGO_FALLBACK } from '@/lib/branding'

// Renders the active admin-selected brand logo image. If the active logo fails
// to load (broken URL, expired asset) it falls back to the guaranteed default
// /logo.jpg so branding is never lost.
export function BrandLogoImage({ className, imgClassName, loading, ...rest }) {
  const { logo } = useBranding()
  const [errored, setErrored] = React.useState(false)

  const src = errored ? BRAND_LOGO_FALLBACK : logo.url || BRAND_LOGO_FALLBACK

  return (
    <img
      key={src}
      src={src}
      alt={logo.alt}
      onError={() => setErrored(true)}
      loading={loading}
      className={cn('h-10 w-auto object-contain', imgClassName)}
      {...rest}
    />
  )
}