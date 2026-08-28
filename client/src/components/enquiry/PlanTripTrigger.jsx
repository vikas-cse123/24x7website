import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/ui'

// Opens the reusable "Plan Your Dream Trip" custom-trip enquiry modal.
// `destinationId` pre-selects that destination when opened contextually
// (e.g. from a destination page).
export function PlanTripTrigger({ destinationId, children, className, variant, size }) {
  const openPlanTrip = useUIStore((s) => s.openPlanTrip)
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => openPlanTrip(destinationId || null)}
    >
      {children || 'Plan Your Dream Trip'}
    </Button>
  )
}