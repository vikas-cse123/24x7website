import * as React from 'react'
import { cn } from '@/lib/utils'

// Lightweight native select styled with the design system. Accessible and
// dependency-free (no Radix needed for the current select use cases).
const Select = React.forwardRef(({ className, ...props }, ref) => (
  <select
    className={cn(
      'flex h-11 w-full min-w-0 max-w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    ref={ref}
    {...props}
  />
))
Select.displayName = 'Select'

export { Select }