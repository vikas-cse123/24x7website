import { IndianRupee } from 'lucide-react'

// Pricing breakdown card used by the booking wizard and the confirmation page.
// Values come from either a client-side ESTIMATE (wizard, clearly labelled)
// or the server's authoritative snapshot (confirmation).
export function BookingPriceSummary({ pricing, variant = 'estimate' }) {
  const fmt = (n) => Number(n || 0).toLocaleString('en-IN')
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <p className="text-sm font-semibold">
        {variant === 'estimate' ? 'Price summary' : 'Price details'}
      </p>
      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">
            ₹{fmt(pricing.unitPrice)} × {pricing.travellerCount}{' '}
            {pricing.travellerCount === 1 ? 'traveller' : 'travellers'}
          </dt>
          <dd className="font-medium whitespace-nowrap">₹{fmt(pricing.subtotal)}</dd>
        </div>
        {Number(pricing.discountAmount) > 0 && (
          <div className="flex items-center justify-between gap-4 text-primary">
            <dt>Discount</dt>
            <dd className="font-medium whitespace-nowrap">− ₹{fmt(pricing.discountAmount)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-4 border-t border-border pt-2.5">
          <dt className="font-semibold">Total</dt>
          <dd className="flex items-center font-bold whitespace-nowrap">
            <IndianRupee className="h-4 w-4" aria-hidden="true" />
            {fmt(pricing.totalAmount)}
          </dd>
        </div>
      </dl>
      {variant === 'estimate' && (
        <p className="mt-3 text-xs text-muted-foreground">
          Estimated total — the final amount is confirmed by us at booking time.
        </p>
      )}
    </div>
  )
}
