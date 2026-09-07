import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, CalendarDays, MapPin, Users, LogIn, RotateCw } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookingPriceSummary } from '@/components/booking/BookingPriceSummary'
import { bookingApi } from '@/services/bookings'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/ui'
import { formatDateLong, nightsBetween } from '@/lib/dates'
import { formatPhone } from '@/lib/phone'
import { useSeo } from '@/lib/seo'

const STATUS_BADGE = {
  pending: 'warning',
  confirmed: 'success',
  payment_pending: 'warning',
  cancelled: 'destructive',
  completed: 'secondary',
}

export function BookingConfirmationPage() {
  const { param: bookingCode } = useParams()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const openAuthModal = useUIStore((s) => s.openAuthModal)

  // Booking pages are private — never indexed (ADR-015).
  useSeo({ title: `Booking ${bookingCode}`, noindex: true })

  const query = useQuery({
    queryKey: ['bookings', 'code', bookingCode],
    queryFn: () => bookingApi.getByCode(bookingCode),
    enabled: isAuthenticated,
    retry: false,
  })

  if (!authLoading && !isAuthenticated) {
    return (
      <Container className="py-20">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-card">
          <LogIn className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold">Login to view your booking</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Booking details are private. Log in with the account used to book.
          </p>
          <Button className="mt-6 w-full" onClick={() => openAuthModal()}>
            Login
          </Button>
        </div>
      </Container>
    )
  }

  if (query.isLoading || authLoading) {
    return (
      <Container className="py-12">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </Container>
    )
  }

  if (query.isError || !query.data?.data?.data) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold">Booking not found</h1>
        <p className="mt-2 text-muted-foreground">
          We couldn't find booking {bookingCode} on your account.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => query.refetch()}>
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
          <Link to="/trips">
            <Button>Browse trips</Button>
          </Link>
        </div>
      </Container>
    )
  }

  const b = query.data.data.data
  const nights = nightsBetween(b.batch?.departureDate, b.batch?.returnDate)

  return (
    <Container className="py-10 lg:py-14">
      <div className="mx-auto max-w-2xl">
        {/* Success header */}
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-card sm:p-8">
          <CheckCircle2 className="mx-auto h-14 w-14 text-primary" aria-hidden="true" />
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Booking received!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your seats are reserved. Our team will contact you shortly to
            complete the next steps.
          </p>
          <p className="mt-5 text-xs uppercase tracking-wide text-muted-foreground">Booking ID</p>
          <p className="font-mono text-xl font-bold">{b.bookingCode}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Badge variant={STATUS_BADGE[b.status] || 'secondary'}>
              {b.status === 'pending' ? 'Status: Pending' : `Status: ${b.status}`}
            </Badge>
            <Badge variant="warning">Payment pending</Badge>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Online payments are coming soon — no payment has been collected yet.
          </p>
        </div>

        {/* Trip + schedule */}
        <div className="mt-5 rounded-xl border border-border bg-card p-5 shadow-card sm:p-6">
          <h2 className="text-base font-semibold">{b.trip?.name}</h2>
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
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                Travellers
              </dt>
              <dd className="mt-0.5 font-medium">{b.travellerCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Departure code</dt>
              <dd className="mt-0.5 font-mono font-medium">{b.batch?.batchCode}</dd>
            </div>
          </dl>

          <div className="mt-4 border-t border-border pt-4">
            <p className="text-sm font-medium">Travellers</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {b.travellers.map((t, i) => (
                <li key={i}>
                  {i + 1}. {t.firstName} {t.lastName}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <p className="text-sm font-medium">Contact</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {b.customerName} · {b.customerEmail} · {formatPhone(b.customerPhone, b.countryCode)}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <BookingPriceSummary pricing={b} variant="final" />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/trips">
            <Button>Continue exploring trips</Button>
          </Link>
          <Link to="/">
            <Button variant="outline">Back to home</Button>
          </Link>
        </div>
      </div>
    </Container>
  )
}
