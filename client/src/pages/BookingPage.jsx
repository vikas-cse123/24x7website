import * as React from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CalendarDays,
  MapPin,
  Minus,
  Plus,
  Users,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertTriangle,
  LogIn,
} from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { BookingPriceSummary } from '@/components/booking/BookingPriceSummary'
import { tripApi } from '@/services/trips'
import { tripBatchApi } from '@/services/tripBatches'
import { bookingApi } from '@/services/bookings'
import { accountApi } from '@/services/account'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/ui'
import { estimatePricing } from '@/schemas/booking'
import { formatDateLong } from '@/lib/dates'
import { useSeo } from '@/lib/seo'

const STEPS = ['Travellers', 'Details', 'Review']

function StepIndicator({ current }) {
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="Booking steps">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            aria-current={i === current ? 'step' : undefined}
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
              i === current
                ? 'bg-primary text-primary-foreground'
                : i < current
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {i + 1}
          </span>
          <span className={i === current ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
          {i < STEPS.length - 1 && <span aria-hidden="true" className="mx-1 h-px w-4 bg-border" />}
        </li>
      ))}
    </ol>
  )
}

export function BookingPage() {
  const { param: tripSlug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const batchParam = searchParams.get('batch')

  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const openAuthModal = useUIStore((s) => s.openAuthModal)

  const [step, setStep] = React.useState(0)
  const [travellerCount, setTravellerCount] = React.useState(
    Math.max(1, Number(searchParams.get('travellers')) || 1)
  )

  // One idempotency key per visit of this flow — retries/re-submits reuse it.
  const idempotencyKey = React.useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `bk-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )

  useSeo({ title: 'Complete your booking', noindex: true })

  // --- data -----------------------------------------------------------------
  const tripQuery = useQuery({
    queryKey: ['trips', 'slug', tripSlug],
    queryFn: () => tripApi.getBySlug(tripSlug),
    retry: false,
  })
  const trip = tripQuery.data?.data?.data

  const batchesQuery = useQuery({
    queryKey: ['trip-batches', trip?.id],
    queryFn: () => tripBatchApi.listByTrip(trip.id),
    enabled: !!trip,
    retry: false,
  })
  const batches = batchesQuery.data?.data?.data?.items || []
  const batch = batches.find((b) => b.id === batchParam) || null

  // Saved travellers (Phase 10): optional quick-fill. Values are COPIED into
  // the booking snapshot — later edits never change confirmed bookings.
  const savedTravellersQuery = useQuery({
    queryKey: ['account', 'travellers'],
    queryFn: accountApi.listTravellers,
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
  const savedTravellers = savedTravellersQuery.data?.data?.data?.items || []

  const maxTravellers = Math.max(0, Math.min(batch?.availableSeats ?? 0, 20))
  const soldOut = batch != null && batch.availableSeats <= 0
  const notBookable =
    batch != null && (batch.status !== 'open' || batch.availableSeats <= 0)

  React.useEffect(() => {
    setTravellerCount((c) => Math.min(Math.max(1, c), Math.max(1, maxTravellers || 1)))
  }, [maxTravellers])

  // --- auth gate ------------------------------------------------------------
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) openAuthModal()
  }, [authLoading, isAuthenticated, openAuthModal])

  // --- form state -----------------------------------------------------------
  const [travellers, setTravellers] = React.useState([])
  React.useEffect(() => {
    setTravellers((prev) => {
      const next = [...prev]
      while (next.length < travellerCount) next.push({ firstName: '', lastName: '', email: '', phone: '' })
      return next.slice(0, travellerCount)
    })
  }, [travellerCount])

  const [contact, setContact] = React.useState({ name: '', email: '', phone: '' })
  React.useEffect(() => {
    if (user) {
      setContact((c) => ({
        name: c.name || user.name || '',
        email: c.email || user.email || '',
        phone: c.phone || (user.mobile ? String(user.mobile) : ''),
      }))
    }
  }, [user])

  const [terms, setTerms] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState({})
  const [touchedStep2, setTouchedStep2] = React.useState(false)

  function validateDetails() {
    const errors = {}
    travellers.forEach((t, i) => {
      if (!t.firstName?.trim()) errors[`travellers.${i}.firstName`] = 'First name is required'
      if (!t.lastName?.trim()) errors[`travellers.${i}.lastName`] = 'Last name is required'
      if (t.email && !/^\S+@\S+\.\S+$/.test(t.email)) errors[`travellers.${i}.email`] = 'Enter a valid email address'
      if (t.phone && !/^[0-9+\-\s]{7,15}$/.test(t.phone)) errors[`travellers.${i}.phone`] = 'Enter a valid phone number'
    })
    if (!contact.name.trim()) errors['customer.name'] = 'Contact name is required'
    if (!/^\S+@\S+\.\S+$/.test(contact.email.trim())) errors['customer.email'] = 'Enter a valid email address'
    if (!/^[0-9+\-\s]{7,15}$/.test(contact.phone.trim())) errors['customer.phone'] = 'Enter a valid phone number'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const pricing = batch ? estimatePricing(batch, travellerCount) : null

  const createMutation = useMutation({
    mutationFn: bookingApi.create,
    onSuccess: (res) => {
      const code = res?.data?.data?.bookingCode
      toast.success(`Booking ${code} confirmed!`)
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['trip-batches'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
      navigate(`/booking/${code}`, { replace: true })
    },
    onError: (err) => {
      toast.error(err.message || 'Could not complete the booking')
      // Seat availability may have changed server-side; refresh departures.
      if (trip) queryClient.invalidateQueries({ queryKey: ['trip-batches', trip.id] })
    },
  })

  function submit() {
    if (!terms) {
      toast.error('Please accept the terms to continue')
      return
    }
    if (!validateDetails()) {
      setTouchedStep2(true)
      setStep(1)
      toast.error('Please fix the highlighted fields')
      return
    }
    createMutation.mutate({
      tripBatchId: batch.id,
      travellerCount,
      travellers: travellers.map((t) => ({
        firstName: t.firstName?.trim(),
        lastName: t.lastName?.trim(),
        email: t.email?.trim() || '',
        phone: t.phone?.trim() || '',
      })),
      customerName: contact.name.trim(),
      customerEmail: contact.email.trim(),
      customerPhone: contact.phone.trim(),
      countryCode: '+91',
      termsAccepted: true,
      idempotencyKey: idempotencyKey.current,
    })
  }

  // --- render gates -----------------------------------------------------------
  if (tripQuery.isLoading || authLoading) {
    return (
      <Container className="py-10">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </Container>
    )
  }

  if (tripQuery.isError || !trip) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold">Trip not found</h1>
        <p className="mt-2 text-muted-foreground">This trip may have been unpublished or removed.</p>
        <Button asChild={false} className="mt-6" onClick={() => navigate('/trips')}>
          Browse trips
        </Button>
      </Container>
    )
  }

  if (!batchParam) {
    return (
      <Container className="py-20 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">No departure selected</h1>
        <p className="mt-2 text-muted-foreground">
          Pick a departure date for {trip.name} to start your booking.
        </p>
        <Button className="mt-6" onClick={() => navigate(`/trip/${trip.slug}`)}>
          View departures
        </Button>
      </Container>
    )
  }

  // Departures are still loading (or the selected one is definitively gone).
  if (batchesQuery.isLoading || batchesQuery.isError || !batch) {
    if (batchesQuery.isError || (!batchesQuery.isLoading && !batch)) {
      return (
        <Container className="py-20 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold">Departure unavailable</h1>
          <p className="mt-2 text-muted-foreground">
            This departure may have sold out, closed, or been removed. Pick
            another date from the trip page.
          </p>
          <Button className="mt-6" onClick={() => navigate(`/trip/${trip.slug}`)}>
            View departures
          </Button>
        </Container>
      )
    }
    return (
      <Container className="py-10">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </Container>
    )
  }

  // Auth gate panel — selection is preserved in the URL; after login this page
  // continues exactly where the user left off.
  if (!isAuthenticated) {
    return (
      <Container className="py-20">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-card">
          <LogIn className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold">Login to continue</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your selected departure and traveller count are saved — log in to
            complete your booking.
          </p>
          <Button className="mt-6 w-full" onClick={() => openAuthModal()}>
            Login
          </Button>
          <Link
            to={`/trip/${trip.slug}`}
            className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Back to trip
          </Link>
        </div>
      </Container>
    )
  }

  const err = (path) => fieldErrors[path]

  return (
    <Container className="py-8 lg:py-12">
      {/* Trip header */}
      <Link
        to={`/trip/${trip.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to trip
      </Link>
      <div className="mt-4 flex flex-wrap items-start gap-5 rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
        <DestinationImage
          src={trip.heroImage?.url}
          alt={trip.heroImage?.alt || trip.name}
          className="hidden h-20 w-28 shrink-0 rounded-lg sm:block"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{trip.name}</h1>
          {trip.destination?.name && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              {trip.destination.name}, {trip.destination.country}
            </p>
          )}
          {batch && (
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {formatDateLong(batch.departureDate)} → {formatDateLong(batch.returnDate)}
              </span>
              <span>·</span>
              <span>{batch.batchCode}</span>
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">per traveller</p>
          <p className="text-lg font-bold">₹{Number(batch.price).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <StepIndicator current={step} />

          {/* STEP 1 — traveller count */}
          {step === 0 && (
            <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-card sm:p-6" aria-label="Select travellers">
              <h2 className="text-base font-semibold">How many travellers?</h2>
              {soldOut ? (
                <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                  This departure is sold out. Please pick another date on the trip page.
                </p>
              ) : (
                <>
                  <div className="mt-5 flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-11 min-w-[44px] shrink-0 rounded-full p-0"
                      onClick={() => setTravellerCount((c) => Math.max(1, c - 1))}
                      disabled={travellerCount <= 1}
                      aria-label="Remove one traveller"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <span
                      className="min-w-12 text-center text-3xl font-bold"
                      role="status"
                      aria-live="polite"
                      aria-label={`${travellerCount} travellers selected`}
                    >
                      {travellerCount}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-11 min-w-[44px] shrink-0 rounded-full p-0"
                      onClick={() => setTravellerCount((c) => Math.min(maxTravellers, c + 1))}
                      disabled={travellerCount >= maxTravellers}
                      aria-label="Add one traveller"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <span className="ml-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" aria-hidden="true" />
                      {batch.availableSeats} seats available
                    </span>
                  </div>
                  {travellerCount >= maxTravellers && (
                    <p className="mt-3 text-xs text-amber-600">
                      Maximum available seats for this departure selected.
                    </p>
                  )}
                </>
              )}
              <div className="mt-6 flex justify-end">
                <Button type="button" disabled={soldOut} onClick={() => setStep(1)}>
                  Continue
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </section>
          )}

          {/* STEP 2 — traveller details + contact */}
          {step === 1 && (
            <section className="mt-6 space-y-6" aria-label="Traveller and contact details">
              {travellers.map((t, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      Traveller {i + 1}
                      {i === 0 && (
                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                          Lead traveller
                        </span>
                      )}
                    </p>
                    {savedTravellers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`saved-${i}`}
                          className="text-xs text-muted-foreground"
                        >
                          Use saved
                        </Label>
                        <select
                          id={`saved-${i}`}
                          value=""
                          aria-label={`Load saved traveller into traveller ${i + 1} form`}
                          className="h-8 max-w-[190px] rounded-md border border-input bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onChange={(e) => {
                            const s = savedTravellers.find((x) => x.id === e.target.value)
                            if (!s) return
                            setTravellers((arr) =>
                              arr.map((x, j) =>
                                j === i
                                  ? {
                                      ...x,
                                      firstName: s.firstName || '',
                                      lastName: s.lastName || '',
                                      email: s.email || '',
                                      phone: s.phone || '',
                                    }
                                  : x
                              )
                            )
                          }}
                        >
                          <option value="">Select…</option>
                          {savedTravellers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.firstName} {s.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`t-${i}-first`}>First name *</Label>
                      <Input
                        id={`t-${i}-first`}
                        className="mt-1.5"
                        value={t.firstName}
                        autoComplete="given-name"
                        aria-invalid={!!err(`travellers.${i}.firstName`)}
                        onChange={(e) =>
                          setTravellers((arr) => arr.map((x, j) => (j === i ? { ...x, firstName: e.target.value } : x)))
                        }
                      />
                      {err(`travellers.${i}.firstName`) && (
                        <p className="mt-1 text-xs text-destructive">{err(`travellers.${i}.firstName`)}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`t-${i}-last`}>Last name *</Label>
                      <Input
                        id={`t-${i}-last`}
                        className="mt-1.5"
                        value={t.lastName}
                        autoComplete="family-name"
                        aria-invalid={!!err(`travellers.${i}.lastName`)}
                        onChange={(e) =>
                          setTravellers((arr) => arr.map((x, j) => (j === i ? { ...x, lastName: e.target.value } : x)))
                        }
                      />
                      {err(`travellers.${i}.lastName`) && (
                        <p className="mt-1 text-xs text-destructive">{err(`travellers.${i}.lastName`)}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`t-${i}-email`} hint-ignore="true">
                        Email <span className="text-xs text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        id={`t-${i}-email`}
                        type="email"
                        className="mt-1.5"
                        value={t.email}
                        autoComplete="email"
                        aria-invalid={!!err(`travellers.${i}.email`)}
                        onChange={(e) =>
                          setTravellers((arr) => arr.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))
                        }
                      />
                      {err(`travellers.${i}.email`) && (
                        <p className="mt-1 text-xs text-destructive">{err(`travellers.${i}.email`)}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`t-${i}-phone`}>
                        Phone <span className="text-xs text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        id={`t-${i}-phone`}
                        type="tel"
                        className="mt-1.5"
                        value={t.phone}
                        autoComplete="tel"
                        aria-invalid={!!err(`travellers.${i}.phone`)}
                        onChange={(e) =>
                          setTravellers((arr) => arr.map((x, j) => (j === i ? { ...x, phone: e.target.value } : x)))
                        }
                      />
                      {err(`travellers.${i}.phone`) && (
                        <p className="mt-1 text-xs text-destructive">{err(`travellers.${i}.phone`)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h2 className="text-sm font-semibold">Booking contact</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  We'll send booking updates here. Prefilled from your account where available.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="c-name">Full name *</Label>
                    <Input
                      id="c-name"
                      className="mt-1.5"
                      value={contact.name}
                      autoComplete="name"
                      aria-invalid={!!err('customer.name')}
                      onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                    />
                    {err('customer.name') && <p className="mt-1 text-xs text-destructive">{err('customer.name')}</p>}
                  </div>
                  <div>
                    <Label htmlFor="c-email">Email *</Label>
                    <Input
                      id="c-email"
                      type="email"
                      className="mt-1.5"
                      value={contact.email}
                      autoComplete="email"
                      aria-invalid={!!err('customer.email')}
                      onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    />
                    {err('customer.email') && <p className="mt-1 text-xs text-destructive">{err('customer.email')}</p>}
                  </div>
                  <div>
                    <Label htmlFor="c-phone">Phone *</Label>
                    <div className="mt-1.5 flex items-stretch gap-2">
                      <span className="inline-flex h-11 shrink-0 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                        +91
                      </span>
                      <Input
                        id="c-phone"
                        type="tel"
                        value={contact.phone}
                        autoComplete="tel-national"
                        maxLength={10}
                        aria-invalid={!!err('customer.phone')}
                        onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                      />
                    </div>
                    {err('customer.phone') && <p className="mt-1 text-xs text-destructive">{err('customer.phone')}</p>}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setTouchedStep2(true)
                    if (validateDetails()) setStep(2)
                    else toast.error('Please fix the highlighted fields')
                  }}
                >
                  Review booking
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              {touchedStep2 && Object.keys(fieldErrors).length > 0 && (
                <p role="alert" className="text-sm text-destructive">
                  Some required details are missing or invalid.
                </p>
              )}
            </section>
          )}

          {/* STEP 3 — review & confirm */}
          {step === 2 && (
            <section className="mt-6 space-y-5" aria-label="Review booking">
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h2 className="text-base font-semibold">Review your booking</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Departure</dt>
                    <dd className="font-medium text-right">
                      {formatDateLong(batch.departureDate)} → {formatDateLong(batch.returnDate)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Travellers</dt>
                    <dd className="font-medium">{travellerCount}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Lead traveller</dt>
                    <dd className="font-medium">
                      {travellers[0]?.firstName} {travellers[0]?.lastName}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Contact</dt>
                    <dd className="font-medium text-right">
                      {contact.name}
                      <br />
                      {contact.email} · {contact.phone}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-sm font-medium">Traveller names</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {travellers.map((t, i) => (
                      <li key={i}>
                        {i + 1}. {t.firstName} {t.lastName}
                      </li>
                    ))}
                  </ul>
                </div>

                <label className="mt-4 flex items-start gap-2.5 text-sm">
                  <Checkbox
                    className="mt-0.5"
                    checked={terms}
                    onCheckedChange={(v) => setTerms(!!v)}
                    aria-required="true"
                  />
                  <span>
                    I agree to the Terms &amp; Conditions and understand this booking requests{' '}
                    {travellerCount} seat(s); payment will be collected separately.
                  </span>
                </label>
              </div>

              {createMutation.isError && (
                <p
                  role="alert"
                  className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
                >
                  {createMutation.error?.message || 'Could not complete the booking. Please try again.'}
                </p>
              )}

              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back
                </Button>
                <Button type="button" onClick={submit} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {createMutation.isPending ? 'Confirming…' : 'Confirm booking'}
                </Button>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar summary */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          {pricing && <BookingPriceSummary pricing={{ ...pricing, travellerCount }} />}
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Payment pending</p>
            <p className="mt-1">
              Online payments are coming soon. Your seats are reserved when the
              booking is created and our team will contact you to arrange payment.
            </p>
          </div>
        </aside>
      </div>
    </Container>
  )
}
