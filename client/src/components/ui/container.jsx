import * as React from 'react'
import { cn } from '@/lib/utils'

// Consistent page container. Uses the Tailwind `container` theme tokens.
export function Container({ className, as: Comp = 'div', ...props }) {
  return (
    <Comp className={cn('container mx-auto w-full', className)} {...props} />
  )
}
