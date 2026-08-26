import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CalendarDays, MapPin, Users, ChevronLeft, ChevronRight, Ban } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { bookingApi } from '@/services/bookings'
import { accountApi } from '@/services/account'
import { formatDateLong } from '@/lib/dates'
import { cn } from '@/lib/utils'

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'payment_pending', label: 'Payment pending' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]

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

function CancelDialog({ bookingCode, open, onOpenChange, onConfirm, pending }) {
  if (!open) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">Cancel booking</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cancel <strong className="font-mono">{bookingCode}</strong>? Your reserved
            seats will be released immediately. This cannot be undone.
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

export function AccountBookingsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = React.useState(1)
  const [status, setStatus] = React.useState('')
  const [cancelTarget, setCancelTarget] = React.useState(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['account', 'bookings', { page, status: status || undefined }],
    queryFn: () =>
      accountApi.listBookings({ page, limit: 8, ...(status ? { status } : {}) }),
    placeholderData: (prev) => prev,
  })

  const result = data?.data?.data
  const items = result?.items || []

  const cancelMutation = useMutation({
    mutationFn: (id) => bookingApi.cancel(id),
    onSuccess: () => {
      toast.success('Booking cancelled and seats released')
      setCancelTarget(null)
      queryClient.invalidateQueries({ queryKey: ['account'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (err) => toast.error(err.message || 'Cancellation failed'),
  })

  if (isLoading && !result) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="border-destructive/40 p-6 text-sm text-destructive">
        Could not load your bookings. {error?.message || 'Please try again.'}
      </Card>
    )
  }

  const cancellable = ['pending', 'confirmed', 'payment_pending']

  return (
    <div>
      {/* Status filters */}
      <div
        role="group"
        aria-label="Filter bookings by status"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => {
              setStatus(f.value)
              setPage(1)
            }}
            aria-pressed={status === f.value}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              status === f.value
                ? 'bg-primary text-primary-foreground'
                : 'border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!items.length ? (
        <Card className="mt-4 p-12 text-center">
          <p className="text-lg font-medium">
            {status ? `No ${STATUS_FILTERS.find((f) => f.value === status)?.label.toLowerCase()} bookings.` : 'No bookings yet.'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your trips will appear here once you book.
          </p>
          <Link to="/trips">
            <Button className="mt-5">Explore upcoming trips</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {items.map((b) => (
              <Card key={b.id} className="overflow-hidden transition-shadow hover:shadow-card-hover">
                <Link
                  to={`/account/bookings/${b.bookingCode}`}
                  className="block p-4 focus-visible:outline-none sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{b.bookingCode}</p>
                      <h3 className="mt-0.5 font-semibold leading-snug">{b.trip?.name}</h3>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Badge variant={STATUS_BADGE[b.status] || 'secondary'}>{b.status.replace('_', ' ')}</Badge>
                      <Badge variant={PAYMENT_BADGE[b.paymentStatus] || 'secondary'}>
                        {b.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {b.trip?.destination?.name && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {b.trip.destination.name}, {b.trip.destination.country}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {formatDateLong(b.batch?.departureDate)} → {formatDateLong(b.batch?.returnDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {b.travellerCount} traveller{b.travellerCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </Link>
                <div className="flex items-center justify-between border-t border-border px-4 py-3 sm:px-5">
                  <span className="text-lg font-bold">
                    ₹{Number(b.totalAmount).toLocaleString('en-IN')}
                  </span>
                  {cancellable.includes(b.status) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault()
                        setCancelTarget(b)
                      }}
                    >
                      <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                      Cancel
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {result.totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={result.page <= 1}
                onClick={() => setPage(result.page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {result.page} of {result.totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={result.page >= result.totalPages}
                onClick={() => setPage(result.page + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </nav>
          )}
        </>
      )}

      <CancelDialog
        bookingCode={cancelTarget?.bookingCode}
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        onConfirm={() => cancelMutation.mutate(cancelTarget.id)}
        pending={cancelMutation.isPending}
      />
    </div>
  )
}
