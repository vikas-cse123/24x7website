import * as React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { TripBatchForm } from '@/components/admin/TripBatchForm'
import { adminTripBatchApi } from '@/services/tripBatches'
import { adminTripApi } from '@/services/trips'
import { toPayload } from '@/schemas/tripBatch'

export function AdminTripBatchFormPage({ mode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = mode === 'edit'

  // Real trips from the existing admin trips API (drafts included so batches
  // can be prepared before a trip is published).
  const { data: tripData } = useQuery({
    queryKey: ['admin', 'trips', { page: 1, limit: 100 }],
    queryFn: () => adminTripApi.list({ page: 1, limit: 100 }),
  })

  const { data: editData, isLoading: loadingEdit } = useQuery({
    queryKey: ['admin', 'trip-batches', id],
    queryFn: () => adminTripBatchApi.getById(id),
    enabled: isEdit && !!id,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'trip-batches'] })
    queryClient.invalidateQueries({ queryKey: ['trips'] })
    queryClient.invalidateQueries({ queryKey: ['home'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
  }

  const createMutation = useMutation({
    mutationFn: (values) => adminTripBatchApi.create(values),
    onSuccess: () => {
      toast.success('Batch created')
      invalidate()
      navigate('/admin/trip-batches')
    },
    onError: (err) => toast.error(err.message || 'Create failed'),
  })

  const updateMutation = useMutation({
    mutationFn: (values) => adminTripBatchApi.update(id, values),
    onSuccess: () => {
      toast.success('Batch updated')
      invalidate()
      navigate('/admin/trip-batches')
    },
    onError: (err) => toast.error(err.message || 'Update failed'),
  })

  const trips = tripData?.data?.data?.items || []
  const batch = editData?.data?.data

  const initialValues = React.useMemo(() => {
    if (!isEdit || !batch) return undefined
    return {
      tripId: batch.tripId || '',
      departureDate: (batch.departureDate || '').slice(0, 10),
      returnDate: (batch.returnDate || '').slice(0, 10),
      price: batch.price ?? '',
      originalPrice: batch.originalPrice ?? null,
      currency: batch.currency || 'INR',
      totalSeats: batch.totalSeats ?? 16,
      bookedSeats: batch.bookedSeats ?? 0,
      bookingOpenDate: batch.bookingOpenDate ? batch.bookingOpenDate.slice(0, 10) : null,
      bookingCloseDate: batch.bookingCloseDate ? batch.bookingCloseDate.slice(0, 10) : null,
      status: batch.status || 'draft',
      published: !!batch.published,
      notes: batch.notes || '',
    }
  }, [isEdit, batch])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  if (isEdit && loadingEdit) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (isEdit && !batch) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Trip batch not found</p>
        <Link
          to="/admin/trip-batches"
          className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to trip batches
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/admin/trip-batches"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <ArrowLeft className="h-4 w-4" />
          Trip batches
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {isEdit ? `Edit ${batch.batchCode}` : 'New trip batch'}
        </h1>
        {isEdit && batch.trip && (
          <p className="mt-1 text-sm text-muted-foreground">{batch.trip.name}</p>
        )}
      </div>

      <TripBatchForm
        key={isEdit ? batch.id : 'create'}
        initialValues={initialValues}
        trips={trips}
        batchCode={isEdit ? batch.batchCode : undefined}
        isSubmitting={isSubmitting}
        submitLabel={isEdit ? 'Save changes' : 'Create batch'}
        onSubmit={(values) => {
          if (isEdit) updateMutation.mutate(toPayload(values))
          else createMutation.mutate(toPayload(values))
        }}
      />
    </div>
  )
}
