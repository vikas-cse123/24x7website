import * as React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { BrandLogoImage } from '@/components/brand/BrandLogoImage'
import { BRAND_NAME } from '@/lib/branding'

// Official 24x7Chhutti logo. Resolves the admin-managed active logo and falls
// back to client/public/logo.jpg (the default logo) automatically. Never
// modify the source logo files.
export function Logo({ className, imgClassName, to = '/', withLink = true }) {
  const img = <BrandLogoImage imgClassName={imgClassName} />

  if (!withLink) {
    return <span className={cn('inline-block', className)}>{img}</span>
  }

  return (
    <Link
      to={to}
      aria-label={`${BRAND_NAME} home`}
      className={cn('inline-flex items-center', className)}
    >
      {img}
    </Link>
  )
}