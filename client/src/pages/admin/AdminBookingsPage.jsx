import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Eye, Ban, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { adminBookingApi } from '@/services/bookings'
import { formatDateLong } from '@/lib/dates'

const PAGE_SIZE = 10

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

export const BOOKING_STATUS_OPTIONS = ['pending', 'confirmed', 'payment_pending', 'completed']

function StatusDialog({ booking, open, onOpenChange, onConfirm, pending }) {
  const [status, setStatus] = React.useState(booking?.status || 'pending')
  React.useEffect(() => {
    if (booking) setStatus(booking.status === 'cancelled' ? 'cancelled' : booking.status)
  }, [booking])
  if (!booking) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">Change status</h2>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{booking.bookingCode}</p>
          <div className="mt-4">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="New booking status"
              disabled={status === 'cancelled'}
            >
              {[booking.status, ...BOOKING_STATUS_OPTIONS.filter((s) => s !== booking.status)].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              {booking.status === 'cancelled' && <option value="cancelled">cancelled</option>}
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">
              To cancel a booking use Cancel — it also releases the reserved seats.
            </p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => onConfirm(status)} disabled={pending || status === booking.status}>
              {pending ? 'Saving…' : 'Update status'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CancelDialog({ booking, open, onOpenChange, onConfirm, pending }) {
  if (!booking) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">Cancel booking</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cancel <strong className="font-mono">{booking.bookingCode}</strong>? The{' '}
            {booking.travellerCount} reserved seat(s) will be released immediately. This cannot be
            undone.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Keep booking
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={pending}>
              {pending ? 'Cancelling…' : 'Cancel booking'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AdminBookingsPage() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')
  const [statusTarget, setStatusTarget] = React.useState(null)
  const [cancelTarget, setCancelTarget] = React.useState(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'bookings', { page: 1, limit: PAGE_SIZE, search: searchInput || undefined, status: statusFilter || undefined }],
    queryFn: () =>
      adminBookingApi.list({
        page: 1,
        limit: PAGE_SIZE,
        ...(searchInput.trim() ? { search: searchInput.trim() } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
  })

  const list = data?.data?.data

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
    queryClient.invalidateQueries({ queryKey: ['bookings'] })
    queryClient.invalidateQueries({ queryKey: ['trip-batches'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminBookingApi.setStatus(id, status),
    onSuccess: () => {
      invalidate()
      toast.success('Booking status updated')
      setStatusTarget(null)
    },
    onError: (err) => toast.error(err.message || 'Status update failed'),
  })
  const cancelMutation = useMutation({
    mutationFn: (id) => adminBookingApi.cancel(id),
    onSuccess: () => {
      invalidate()
      toast.success('Booking cancelled and seats released')
      setCancelTarget(null)
    },
    onError: (err) => toast.error(err.message || 'Cancellation failed'),
  })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customer bookings with price snapshots and seat reservations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="booking-search" className="sr-only">
            Search bookings
          </label>
          <Input
            id="booking-search"
            type="search"
            placeholder="Search code, customer…"
            className="h-9 w-56"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <label htmlFor="booking-status-filter" className="sr-only">
            Filter by status
          </label>
          <Select
            id="booking-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 w-auto"
            aria-label="Filter by booking status"
          >
            <option value="">All statuses</option>
            {['pending', 'confirmed', 'payment_pending', 'cancelled', 'completed'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/40 p-6 text-sm text-destructive">
          Could not load bookings. {error?.message || 'Please try again.'}
        </Card>
      ) : list && list.items.length === 0 ? (
        <Card className="p-16 text-center">
          <p className="text-lg font-medium">No bookings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Bookings created by customers will appear here.
          </p>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Trip</th>
                  <th className="px-4 py-3 font-medium">Departure</th>
                  <th className="px-4 py-3 font-medium">Travellers</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((b) => (
                  <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/bookings/${b.id}`}
                        className="font-mono text-xs font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        {b.bookingCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.customerName}</p>
                      <p className="text-xs text-muted-foreground">{b.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[180px] truncate">{b.trip?.name || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDateLong(b.batch?.departureDate)}
                    </td>
                    <td className="px-4 py-3">{b.travellerCount}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      ₹{Number(b.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={PAYMENT_BADGE[b.paymentStatus] || 'secondary'}>{b.paymentStatus}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE[b.status] || 'secondary'}>{b.status}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {formatDateLong(b.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <BookingActions
                        booking={b}
                        onView={() => {}}
                        onStatus={() => setStatusTarget(b)}
                        onCancel={() => setCancelTarget(b)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {list.items.map((b) => (
              <Card key={b.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link to={`/admin/bookings/${b.id}`} className="font-mono text-sm font-medium hover:text-primary">
                    {b.bookingCode}
                  </Link>
                  <div className="flex gap-1.5">
                    <Badge variant={PAYMENT_BADGE[b.paymentStatus] || 'secondary'}>{b.paymentStatus}</Badge>
                    <Badge variant={STATUS_BADGE[b.status] || 'secondary'}>{b.status}</Badge>
                  </div>
                </div>
                <p className="mt-2 font-medium">{b.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {b.trip?.name} · {formatDateLong(b.batch?.departureDate)} · {b.travellerCount} traveller(s)
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold">₹{Number(b.totalAmount).toLocaleString('en-IN')}</span>
                  <div className="flex gap-1">
                    <BookingActions
                      booking={b}
                      onView={() => {}}
                      onStatus={() => setStatusTarget(b)}
                      onCancel={() => setCancelTarget(b)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {list.totalPages > 1 && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Page {list.page} of {list.totalPages} — showing the most recent bookings.
            </p>
          )}
        </>
      )}

      <StatusDialog
        booking={statusTarget}
        open={!!statusTarget}
        onOpenChange={(o) => !o && setStatusTarget(null)}
        onConfirm={(status) => statusMutation.mutate({ id: statusTarget.id, status })}
        pending={statusMutation.isPending}
      />
      <CancelDialog
        booking={cancelTarget}
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        onConfirm={() => cancelMutation.mutate(cancelTarget.id)}
        pending={cancelMutation.isPending}
      />
    </div>
  )
}

function BookingActions({ booking, onStatus, onCancel }) {
  const btn =
    'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  const cancellable = ['pending', 'confirmed', 'payment_pending'].includes(booking.status)
  return (
    <div className="flex items-center gap-1">
      <Link to={`/admin/bookings/${booking.id}`} title="View" aria-label={`View ${booking.bookingCode}`} className={btn}>
        <Eye className="h-4 w-4" aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={onStatus}
        title="Change status"
        aria-label={`Change status of ${booking.bookingCode}`}
        disabled={booking.status === 'cancelled'}
        className={`${btn} disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
      </button>
      {cancellable && (
        <button
          type="button"
          onClick={onCancel}
          title="Cancel booking"
          aria-label={`Cancel ${booking.bookingCode}`}
          className={`${btn} hover:bg-destructive/10 hover:text-destructive`}
        >
          <Ban className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
