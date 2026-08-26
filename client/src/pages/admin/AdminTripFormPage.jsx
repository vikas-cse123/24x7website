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
      name: trip.name,
      slug: trip.slug,
      shortDescription: trip.shortDescription || '',
      description: trip.description || '',
      tripType: trip.tripType || 'group',
      durationDays: trip.durationDays || 1,
      durationNights: trip.durationNights || 0,
      maxGroupSize: trip.maxGroupSize || 10,
      startingPrice: trip.startingPrice ?? null,
      currency: trip.currency || 'INR',
      heroImage: { url: trip.heroImage?.url || '', alt: trip.heroImage?.alt || '' },
      gallery: trip.gallery || [],
      itinerary: trip.itinerary || [],
      inclusions: trip.inclusions || [],
      exclusions: trip.exclusions || [],
      importantInformation: trip.importantInformation || '',
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
      <div className="mb-6">
        <Link
          to="/admin/trips"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <ArrowLeft className="h-4 w-4" />
          Trips
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {isEdit ? `Edit ${trip.name}` : 'New trip'}
        </h1>
      </div>

      <TripForm
        key={isEdit ? trip.id : 'create'}
        initialValues={initialValues}
        destinations={destinationsWithCurrent}
        tripCode={isEdit ? trip.tripCode : undefined}
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