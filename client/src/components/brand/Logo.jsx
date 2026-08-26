import * as React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

// Official 24x7Chhutti logo. References client/public/logo.jpg (a copy of the
// root logo.jpg). Never modify the source logo.
export function Logo({ className, imgClassName, to = '/', withLink = true }) {
  const img = (
    <img
      src="/logo.jpg"
      alt="24x7Chhutti"
      className={cn('h-10 w-auto object-contain', imgClassName)}
    />
  )

  if (!withLink) {
    return <span className={cn('inline-block', className)}>{img}</span>
  }

  return (
    <Link
      to={to}
      aria-label="24x7Chhutti home"
      className={cn('inline-flex items-center', className)}
    >
      {img}
    </Link>
  )
}
