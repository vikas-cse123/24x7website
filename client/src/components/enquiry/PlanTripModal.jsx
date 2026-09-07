import * as React from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { X, CheckCircle2, Loader2, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { destinationApi } from '@/services/destinations'
import { enquiryApi } from '@/services/enquiries'
import { useUIStore } from '@/stores/ui'
import { Label } from '@/components/ui/label'

// Capture A Trip-style lead-capture modal (own implementation):
// dark overlay + compact centered white card + single-column form.
// Public visitors can submit without logging in.

const MOBILE = /^[6-9]\d{9}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function DestinationField({ value, onChange, destinations, isLoading, isError }) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const rootRef = React.useRef(null)
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const filtered = React.useMemo(() => {
    if (!search.trim()) return destinations
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    return destinations.filter(
      (d) => (d.name || '').match(rx) || (d.country || '').match(rx)
    )
  }, [destinations, search])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id="plan-trip-destination"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={!!value.error}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          value.error && 'border-destructive'
        )}
      >
        <span className={cn('truncate', value.id ? 'text-foreground' : 'text-muted-foreground')}>
          {value.name || 'Choose your destination...'}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-md border border-border bg-popover shadow-card">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                role="searchbox"
                aria-label="Search destinations"
                placeholder="Search destinations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <ul role="listbox" aria-labelledby="plan-trip-destination" className="max-h-48 overflow-y-auto p-1">
            {isLoading ? (
              <li className="px-3 py-3 text-center text-sm text-muted-foreground">
                <Loader2 className="mx-auto h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                <span className="mt-1 block">Loading destinations…</span>
              </li>
            ) : isError ? (
              <li className="px-3 py-3 text-center text-sm text-destructive">
                Could not load destinations. Please try again.
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-3 text-center text-sm text-muted-foreground">
                No destinations match “{search}”.
              </li>
            ) : (
              filtered.map((d) => {
                const selected = value.id === d.id
                return (
                  <li key={d.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ id: d.id, name: d.name })
                        setOpen(false)
                        setSearch('')
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                        selected
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{d.name}</span>
                        {d.country && (
                          <span className="block truncate text-xs text-muted-foreground">{d.country}</span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export function PlanTripModal() {
  const open = useUIStore((s) => s.planTripOpen)
  const contextDestinationId = useUIStore((s) => s.planTripDestinationId)
  const close = useUIStore((s) => s.closePlanTrip)

  const [stage, setStage] = React.useState('form') // 'form' | 'success'
  const [name, setName] = React.useState('')
  const [destination, setDestination] = React.useState({ id: null, name: '', error: null })
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [fieldErrors, setFieldErrors] = React.useState({})
  const [submitError, setSubmitError] = React.useState(null)
  const formRef = React.useRef(null)

  // Destinations are loaded lazily (only while open) from the real published
  // destinations API. No hardcoded list.
  const destQuery = useQuery({
    queryKey: ['enquiry', 'destinations'],
    queryFn: () => destinationApi.list({ limit: 50 }),
    enabled: open,
    staleTime: 300_000,
  })
  const destinations = React.useMemo(
    () => (destQuery.data?.data?.data?.items || []).map((d) => ({ id: d.id, name: d.name, country: d.country })),
    [destQuery.data]
  )

  // Contextual destination preselection (e.g. opened from /destination/bali).
  React.useEffect(() => {
    if (!open) return
    if (!contextDestinationId || destination.id) return
    if (destinations.length === 0) return
    const match = destinations.find((d) => d.id === contextDestinationId)
    if (match) setDestination({ id: match.id, name: match.name, error: null })
  }, [open, contextDestinationId, destinations, destination.id])

  // Reset state on close so the next open is clean (context preselection re-applies).
  const wasOpen = React.useRef(false)
  React.useEffect(() => {
    if (wasOpen.current && !open) {
      setStage('form')
      setName('')
      setDestination({ id: null, name: '', error: null })
      setPhone('')
      setEmail('')
      setFieldErrors({})
      setSubmitError(null)
    }
    wasOpen.current = open
  }, [open])

  // Body scroll lock + Escape close while open.
  React.useEffect(() => {
    if (!open) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  function validate() {
    const errors = {}
    if (!name.trim()) errors.name = 'Name is required'
    else if (name.trim().length > 120) errors.name = 'Name is too long'
    if (!destination.id) errors.destination = 'Please select a destination'
    if (!MOBILE.test(phone.replace(/\s/g, ''))) errors.phone = 'Please enter a valid mobile number'
    if (!EMAIL.test(email.trim())) errors.email = 'Please enter a valid email address'
    setFieldErrors(errors)
    setSubmitError(null)
    return Object.keys(errors).length === 0
  }

  const createMutation = useMutation({
    mutationFn: (payload) => enquiryApi.create(payload),
    onSuccess: () => {
      setStage('success')
    },
    onError: (err) => {
      // Prefer server field errors if the backend returned them.
      const serverErrors = err.errors
      if (Array.isArray(serverErrors) && serverErrors.length > 0) {
        const map = {}
        for (const e of serverErrors) {
          const path = e.path === 'destinationId' ? 'destination' : e.path
          map[path] = e.message
        }
        setFieldErrors((prev) => ({ ...prev, ...map }))
        setSubmitError('Please fix the highlighted fields and try again.')
      } else {
        setSubmitError('Something went wrong. Please try again.')
      }
    },
  })

  const isSubmitting = createMutation.isPending

  function handleSubmit(e) {
    e.preventDefault()
    if (isSubmitting) return
    setDestination((d) => ({ ...d, error: null }))
    if (!validate()) return
    createMutation.mutate({
      name: name.trim(),
      destinationId: destination.id,
      phone: phone.replace(/\s/g, ''),
      email: email.trim(),
      source: 'custom_trip',
    })
  }

  function handleClose() {
    if (!isSubmitting) close()
  }

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[60] flex items-center justify-center p-4',
        open ? 'animate-fade-in' : 'pointer-events-none invisible'
      )}
      style={{ width: '100vw', height: '100vh' }}
      aria-hidden={!open}
    >
      {open && (
        <>
          {/* Overlay — viewport-level, dark translucent, covers entire viewport */}
          <div
            className="fixed inset-0 bg-black/70"
            style={{ width: '100vw', height: '100vh' }}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal — compact centered card, viewport-centered via flex parent */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-trip-title"
            className="relative w-full max-w-[380px] max-h-[90vh] overflow-y-auto rounded-xl bg-white text-slate-900 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-2.5 top-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            {stage === 'success' ? (
              <div className="px-6 py-10 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-bold">Thank you!</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Your trip enquiry has been received. Our travel expert will get
                  in touch with you.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} noValidate className="p-6">
                <h2 id="plan-trip-title" className="text-lg font-bold leading-snug text-slate-900">
                  Let's plan your dream trip!
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  Drop a few details, and we'll craft an unforgettable adventure
                  just for you!
                </p>

                <div className="mt-5 space-y-4">
                  {/* Name */}
                  <div>
                    <Label htmlFor="plan-trip-name" className="text-slate-700">Name</Label>
                    <input
                      id="plan-trip-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      aria-invalid={!!fieldErrors.name}
                      className={cn(
                        'mt-1.5 h-11 w-full rounded-md border bg-white px-3 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                        fieldErrors.name ? 'border-destructive' : 'border-input'
                      )}
                    />
                    {fieldErrors.name && (
                      <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>
                    )}
                  </div>

                  {/* Destination dropdown */}
                  <div>
                    <Label className="text-slate-700">Destination</Label>
                    <div className="mt-1.5">
                      <DestinationField
                        value={{ ...destination, error: fieldErrors.destination }}
                        onChange={(d) => setDestination({ ...d, error: null })}
                        destinations={destinations}
                        isLoading={destQuery.isLoading}
                        isError={destQuery.isError}
                      />
                    </div>
                    {fieldErrors.destination && (
                      <p className="mt-1 text-xs text-destructive">{fieldErrors.destination}</p>
                    )}
                  </div>

                  {/* Mobile number */}
                  <div>
                    <Label htmlFor="plan-trip-phone" className="text-slate-700">Mobile number</Label>
                    <div className="mt-1.5 flex items-stretch">
                      <span className="inline-flex h-11 shrink-0 items-center rounded-l-md border border-r-0 border-input bg-slate-50 px-3 text-sm text-slate-600">
                        +91
                      </span>
                      <input
                        id="plan-trip-phone"
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter mobile number"
                        autoComplete="tel-national"
                        maxLength={10}
                        aria-invalid={!!fieldErrors.phone}
                        className={cn(
                          'h-11 w-full min-w-0 rounded-r-md border bg-white px-3 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                          fieldErrors.phone ? 'border-destructive' : 'border-input'
                        )}
                      />
                    </div>
                    {fieldErrors.phone && (
                      <p className="mt-1 text-xs text-destructive">{fieldErrors.phone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="plan-trip-email" className="text-slate-700">Email</Label>
                    <input
                      id="plan-trip-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      aria-invalid={!!fieldErrors.email}
                      className={cn(
                        'mt-1.5 h-11 w-full rounded-md border bg-white px-3 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                        fieldErrors.email ? 'border-destructive' : 'border-input'
                      )}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>
                    )}
                  </div>
                </div>

                {submitError && (
                  <p role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {isSubmitting ? 'Submitting...' : 'Talk to our Experts'}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>,
    document.body
  )
}