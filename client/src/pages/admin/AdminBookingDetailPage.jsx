import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { adminBookingApi } from '@/services/bookings'
import { formatDateLong } from '@/lib/dates'
import { formatPhone } from '@/lib/phone'

const STATUS_BADGE = {
  pending: 'warning',
  confirmed: 'success',
  payment_pending: 'warning',
  cancelled: 'destructive',
  completed: 'secondary',
}
const PAYMENT_BADGE = {
  unpaid: 'secondary',
  pending: 'warning',
  paid: 'success',
  failed: 'destructive',
  refunded: 'outline',
}

export function AdminBookingDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'bookings', id],
    queryFn: () => adminBookingApi.getById(id),
    retry: false,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
    queryClient.invalidateQueries({ queryKey: ['trip-batches'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
  }

  const cancelMutation = useMutation({
    mutationFn: () => adminBookingApi.cancel(id),
    onSuccess: () => {
      invalidate()
      toast.success('Booking cancelled and seats released')
    },
    onError: (err) => toast.error(err.message || 'Cancellation failed'),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (isError || !data?.data?.data) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Booking not found</p>
        <p className="mt-1 text-sm text-destructive">{error?.message}</p>
        <Link to="/admin/bookings" className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to bookings
        </Link>
      </div>
    )
  }

  const b = data.data.data
  const cancellable = ['pending', 'confirmed', 'payment_pending'].includes(b.status)

  return (
    <div>
      <Link
        to="/admin/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <ArrowLeft className="h-4 w-4" />
        Bookings
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight">{b.bookingCode}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <Badge variant={STATUS_BADGE[b.status] || 'secondary'}>{b.status}</Badge>
            <Badge variant={PAYMENT_BADGE[b.paymentStatus] || 'secondary'}>
              payment: {b.paymentStatus}
            </Badge>
            <span className="text-muted-foreground">Created {formatDateLong(b.createdAt)}</span>
          </p>
        </div>
        {cancellable && (
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            Cancel booking
          </Button>
        )}
      </div>

      {/* Confirmation guard — cancellation releases seats immediately. */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent onClose={() => setConfirmOpen(false)}>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Cancel booking</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cancel <strong className="font-mono">{b.bookingCode}</strong>? The{' '}
              {b.travellerCount} reserved seat(s) will be released immediately.
              This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Keep booking
              </Button>
              <Button
                variant="destructive"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate()}
              >
                {cancelMutation.isPending ? 'Cancelling…' : 'Cancel booking'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trip &amp; departure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Trip:</span>{' '}
              <Link to={`/trip/${b.trip?.slug}`} target="_blank" className="font-medium hover:text-primary hover:underline">
                {b.trip?.name}
              </Link>{' '}
              <span className="font-mono text-xs text-muted-foreground">({b.trip?.tripCode})</span>
            </p>
            <p>
              <span className="text-muted-foreground">Destination:</span> {b.trip?.destination?.name},{' '}
              {b.trip?.destination?.country}
            </p>
            <p>
              <span className="text-muted-foreground">Batch:</span>{' '}
              <span className="font-mono">{b.batch?.batchCode}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Departure:</span> {formatDateLong(b.batch?.departureDate)}
            </p>
            <p>
              <span className="text-muted-foreground">Return:</span> {formatDateLong(b.batch?.returnDate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Price snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Unit price</dt>
                <dd className="font-medium">₹{Number(b.unitPrice).toLocaleString('en-IN')}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Travellers</dt>
                <dd className="font-medium">{b.travellerCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">₹{Number(b.subtotal).toLocaleString('en-IN')}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="font-medium text-primary">
                  − ₹{Number(b.discountAmount).toLocaleString('en-IN')}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd>₹{Number(b.totalAmount).toLocaleString('en-IN')}</dd>
              </div>
              <p className="pt-1 text-xs text-muted-foreground">
                Snapshot captured at booking time — later batch price changes do not affect this booking.
              </p>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p className="font-medium">{b.customerName}</p>
            <p className="text-muted-foreground">{b.customerEmail}</p>
            <p className="text-muted-foreground">
              {formatPhone(b.customerPhone, b.countryCode)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Travellers ({b.travellerCount})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {b.travellers.map((t, i) => (
                <li key={i} className="rounded-lg border border-border p-3">
                  <p className="font-medium">
                    {i + 1}. {t.firstName} {t.lastName}
                  </p>
                  {(t.email || t.phone) && (
                    <p className="text-xs text-muted-foreground">
                      {[t.email, t.phone].filter(Boolean).join(' · ') || '—'}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
