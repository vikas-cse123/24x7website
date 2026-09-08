import * as React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { TripForm } from '@/components/admin/TripForm'
import { adminTripApi } from '@/services/trips'
import { destinationApi } from '@/services/destinations'

function preparePayload(values) {
  const payload = { ...values }
  if (!payload.slug) delete payload.slug
  // Trip hero media is now derived from destination — never stored on trip
  if ('heroImage' in payload) delete payload.heroImage
  if ('heroVideo' in payload) delete payload.heroVideo
  // Reviews are no longer managed via Trip form — preserve legacy data
  if ('reviews' in payload) delete payload.reviews
  // No Trip Name input exists in the UI: the canonical name is derived from
  // Trip Card Name (fallback: page heading, then a placeholder). Existing
  // stored names are never deleted by this mapping.
  const derived = (payload.cardName || '').trim() || (payload.pageHeading || '').trim()
  payload.name = derived || 'Untitled Trip'
  return payload
}

export function AdminTripFormPage({ mode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = mode === 'edit'

  // Published destinations for the selector (prefer published for creation).
  const { data: destData } = useQuery({
    queryKey: ['destinations', { page: 1, limit: 50 }],
    queryFn: () => destinationApi.list({ page: 1, limit: 50 }),
  })

  const { data: editData, isLoading: loadingEdit } = useQuery({
    queryKey: ['admin', 'trips', id],
    queryFn: () => adminTripApi.getById(id),
    enabled: isEdit && !!id,
  })

  const createMutation = useMutation({
    mutationFn: (values) => adminTripApi.create(values),
    onSuccess: () => {
      toast.success('Trip created')
      queryClient.invalidateQueries({ queryKey: ['admin', 'trips'] })
      navigate('/admin/trips')
    },
    onError: (err) => toast.error(err.message || 'Create failed'),
  })

  const updateMutation = useMutation({
    mutationFn: (values) => adminTripApi.update(id, values),
    onSuccess: () => {
      toast.success('Trip updated')
      queryClient.invalidateQueries({ queryKey: ['admin', 'trips'] })
      navigate('/admin/trips')
    },
    onError: (err) => toast.error(err.message || 'Update failed'),
  })

  const destinations = destData?.data?.data?.items || []
  const trip = editData?.data?.data

  // Ensure the currently-selected destination is present even if unpublished.
  const destinationsWithCurrent = React.useMemo(() => {
    if (!trip?.destination) return destinations
    if (destinations.some((d) => d.id === trip.destination.id)) return destinations
    return [
      ...destinations,
      {
        id: trip.destination.id,
        name: trip.destination.name,
        country: trip.destination.country,
      },
    ]
  }, [destinations, trip])

  const initialValues = React.useMemo(() => {
    if (!isEdit || !trip) return undefined
    return {
      destinationId: trip.destinationId || '',
      cardName: trip.cardName || '',
      pageHeading: trip.pageHeading || '',
      slug: trip.slug,
      shortDescription: trip.shortDescription || '',
      description: trip.description || '',
      tripType: Array.isArray(trip.tripType) ? trip.tripType : trip.tripType ? [trip.tripType] : ['group'],
      durationDays: trip.durationDays || 1,
      durationNights: trip.durationNights || 0,
      maxGroupSize: trip.maxGroupSize || 10,
      startingPrice: trip.startingPrice ?? null,
      originalPrice: trip.originalPrice ?? null,
      datesOnRequest: !!trip.datesOnRequest,
      departures: Array.isArray(trip.departures)
        ? trip.departures.map((d) => String(d).slice(0, 10)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
        : [],
      currency: trip.currency || 'INR',
      cardImage: { url: trip.cardImage?.url || '', alt: trip.cardImage?.alt || '' },
      itinerary: trip.itinerary || [],
      inclusions: trip.inclusions || [],
      costing: Array.isArray(trip.costing)
        ? trip.costing.map((r) => ({
            mode: r.mode || '',
            price: r.price ?? null,
            originalPrice: r.originalPrice ?? null,
          }))
        : [],
      exclusions: trip.exclusions || [],
      importantInformation: trip.importantInformation || '',
      thingsToCarry: Array.isArray(trip.thingsToCarry)
        ? trip.thingsToCarry.map((t) => ({
            icon: t.icon || '',
            name: t.name || '',
          }))
        : [],
      faqs: trip.faqs || [],
      featured: !!trip.featured,
      published: !!trip.published,
      displayOrder: trip.displayOrder || 0,
      seoTitle: trip.seoTitle || '',
      seoDescription: trip.seoDescription || '',
      seoKeywords: trip.seoKeywords || '',
    }
  }, [isEdit, trip])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const deleteMutation = useMutation({
    mutationFn: () => adminTripApi.remove(id),
    onSuccess: () => {
      toast.success('Trip deleted')
      queryClient.invalidateQueries({ queryKey: ['admin', 'trips'] })
      navigate('/admin/trips')
    },
    onError: (err) => toast.error(err.message || 'Delete failed'),
  })
  const [moreOpen, setMoreOpen] = React.useState(false)
  const moreRef = React.useRef(null)
  React.useEffect(() => {
    const h = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  if (isEdit && loadingEdit) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (isEdit && !trip) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Trip not found</p>
        <Link to="/admin/trips" className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to trips
        </Link>
      </div>
    )
  }
  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/admin" className="hover:text-slate-700">Admin</Link>
        <span className="text-slate-400">›</span>
        <Link to="/admin/trips" className="hover:text-slate-700">Trips</Link>
        {isEdit && trip?.name && (<><span className="text-slate-400">›</span><span className="truncate font-medium text-slate-700">{trip.name}</span></>)}
      </div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 sm:px-4">
        <div className="flex min-w-0 gap-3">
          <div className="hidden h-9 w-9 shrink-0 place-items-center rounded-md border border-amber-200 bg-amber-50 text-amber-700 sm:grid">
            <span className="text-xs font-bold">T</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Trip</p>
            <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">{isEdit ? trip?.name || 'Edit Trip' : 'Create Trip'}</h1>
            {isEdit && trip && (<p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500"><span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${trip.published ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}><span className={`h-1.5 w-1.5 rounded-full ${trip.published ? 'bg-emerald-500' : 'bg-slate-400'}`} />{trip.published ? 'Published' : 'Draft'}</span>{trip.tripCode && <span className="font-mono text-xs text-slate-500">{trip.tripCode}</span>}</p>)}
            {!isEdit && <p className="mt-0.5 text-xs text-slate-500">Add a new trip to your website.</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isEdit && trip?.slug && (<a href={`/trip/${trip.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Preview</a>)}
          <div className="relative" ref={moreRef}>
            <button type="button" onClick={() => setMoreOpen((v) => !v)} className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50">More <span className="text-xs">▼</span></button>
            {moreOpen && (
              <div className="absolute right-0 top-8 z-20 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                {isEdit && trip?.slug && (<a href={`/trip/${trip.slug}`} target="_blank" rel="noopener noreferrer" className="flex px-3 py-1.5 text-xs hover:bg-slate-50" onClick={() => setMoreOpen(false)}>Preview</a>)}
                <button type="button" className="flex w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50" onClick={() => { navigator.clipboard.writeText(trip?.slug || ''); setMoreOpen(false)}}>Duplicate</button>
                {isEdit && (<button type="button" className="flex w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50" onClick={() => { setMoreOpen(false); if (window.confirm(`Delete "${trip.name}"?`)) deleteMutation.mutate() }}>Delete</button>)}
              </div>
            )}
          </div>
        </div>
      </div>
      <TripForm
        key={isEdit ? trip.id : 'create'}
        initialValues={initialValues}
        destinations={destinationsWithCurrent}
        tripCode={isEdit ? trip.tripCode : undefined}
        tripId={isEdit ? id : undefined}
        isSubmitting={isSubmitting}
        submitLabel={isEdit ? 'Save changes' : 'Create trip'}
        onSubmit={(values) => {
          const payload = preparePayload(values)
          if (isEdit) updateMutation.mutate(payload)
          else createMutation.mutate(payload)
        }}
      />
    </div>
  )
}