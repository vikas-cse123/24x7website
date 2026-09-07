import * as React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, CalendarDays, MapPin, Users, RotateCw, Ban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { accountApi } from '@/services/account'
import { bookingApi } from '@/services/bookings'
import { formatDateLong, nightsBetween } from '@/lib/dates'
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

export function AccountBookingDetailPage() {
  const { bookingCode } = useParams()
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['account', 'bookings', 'code', bookingCode],
    queryFn: () => accountApi.getBookingByCode(bookingCode),
    retry: false,
  })

  const cancelMutation = useMutation({
    mutationFn: () => bookingApi.cancel(data.data.data.id),
    onSuccess: () => {
      toast.success('Booking cancelled and seats released')
      setConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ['account'] })
    },
    onError: (err) => toast.error(err.message || 'Cancellation failed'),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-72 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (isError || !data?.data?.data) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg font-medium">Booking not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We couldn't find booking {bookingCode} on your account.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
          <Link to="/account/bookings">
            <Button>All bookings</Button>
          </Link>
        </div>
      </div>
    )
  }

  const b = data.data.data
  const nights = nightsBetween(b.batch?.departureDate, b.batch?.returnDate)
  const cancellable = ['pending', 'confirmed', 'payment_pending'].includes(b.status)
  const fmt = (n) => Number(n || 0).toLocaleString('en-IN')

  return (
    <div>
      <Link
        to="/account/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <ArrowLeft className="h-4 w-4" />
        My Bookings
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mono text-xl font-bold">{b.bookingCode}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_BADGE[b.status] || 'secondary'}>{b.status.replace('_', ' ')}</Badge>
            <Badge variant={PAYMENT_BADGE[b.paymentStatus] || 'secondary'}>
              payment: {b.paymentStatus}
            </Badge>
            {b.paymentStatus !== 'paid' && b.status !== 'cancelled' && (
              <Badge variant="outline">Payment pending</Badge>
            )}
          </div>
        </div>
        {cancellable && (
          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={cancelMutation.isPending}
          >
            <Ban className="h-4 w-4" aria-hidden="true" />
            Cancel booking
          </Button>
        )}
      </div>

      {/* Trip + schedule */}
      <Card className="mt-5">
        <CardContent className="p-5 sm:p-6">
          <h3 className="text-base font-semibold">{b.trip?.name}</h3>
          {b.trip?.destination && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              {b.trip.destination.name}, {b.trip.destination.country}
            </p>
          )}
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                Departure
              </dt>
              <dd className="mt-0.5 font-medium">{formatDateLong(b.batch?.departureDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Return</dt>
              <dd className="mt-0.5 font-medium">
                {formatDateLong(b.batch?.returnDate)}
                {nights != null ? ` · ${nights}N / ${nights + 1}D` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Departure code</dt>
              <dd className="font-mono">{b.batch?.batchCode}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                Travellers
              </dt>
              <dd className="mt-0.5 font-medium">{b.travellerCount}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Price snapshot */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Price details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  ₹{fmt(b.unitPrice)} × {b.travellerCount} traveller{b.travellerCount > 1 ? 's' : ''}
                </dt>
                <dd className="font-medium">₹{fmt(b.subtotal)}</dd>
              </div>
              {Number(b.discountAmount) > 0 && (
                <div className="flex justify-between gap-4 text-primary">
                  <dt>Discount</dt>
                  <dd className="font-medium">− ₹{fmt(b.discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-border pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd>₹{fmt(b.totalAmount)}</dd>
              </div>
              <p className="pt-1 text-xs text-muted-foreground">
                Snapshot at booking time — later price changes don't affect this booking.
              </p>
            </dl>
          </CardContent>
        </Card>

        {/* Travellers */}
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

        {/* Contact */}
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p className="font-medium">{b.customerName}</p>
            <p className="text-muted-foreground">{b.customerEmail}</p>
            <p className="text-muted-foreground">
              {formatPhone(b.customerPhone, b.countryCode)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation guard */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent onClose={() => setConfirmOpen(false)}>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Cancel booking</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cancel <strong className="font-mono">{b.bookingCode}</strong>? Your{' '}
              {b.travellerCount} reserved seat(s) will be released immediately. This
              cannot be undone.
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
    </div>
  )
}
