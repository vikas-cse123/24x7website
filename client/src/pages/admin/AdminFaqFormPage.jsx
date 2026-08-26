import * as React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { FaqForm } from '@/components/admin/FaqForm'
import { adminFaqApi } from '@/services/faqs'
import { destinationApi } from '@/services/destinations'
import { adminTripApi } from '@/services/trips'

export function AdminFaqFormPage({ mode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = mode === 'edit'

  const { data: destData } = useQuery({
    queryKey: ['destinations', { page: 1, limit: 50 }],
    queryFn: () => destinationApi.list({ page: 1, limit: 50 }),
  })
  const { data: tripData } = useQuery({
    queryKey: ['admin', 'trips', { page: 1, limit: 50 }],
    queryFn: () => adminTripApi.list({ page: 1, limit: 50 }),
  })

  const { data: editData, isLoading: loadingEdit } = useQuery({
    queryKey: ['admin', 'faqs', id],
    queryFn: () => adminFaqApi.getById(id),
    enabled: isEdit && !!id,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] })
    queryClient.invalidateQueries({ queryKey: ['faqs'] })
  }

  const createMutation = useMutation({
    mutationFn: (payload) => adminFaqApi.create(payload),
    onSuccess: () => { toast.success('FAQ created'); invalidate(); navigate('/admin/faqs') },
    onError: (err) => toast.error(err.message || 'Create failed'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => adminFaqApi.update(id, payload),
    onSuccess: () => { toast.success('FAQ updated'); invalidate(); navigate('/admin/faqs') },
    onError: (err) => toast.error(err.message || 'Update failed'),
  })

  const faq = editData?.data?.data
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  if (isEdit && loadingEdit) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }
  if (isEdit && !faq) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">FAQ not found</p>
        <Link to="/admin/faqs" className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to FAQs
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/admin/faqs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <ArrowLeft className="h-4 w-4" /> FAQs
      </Link>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">
        {isEdit ? 'Edit FAQ' : 'New FAQ'}
      </h1>

      <div className="mt-6 max-w-2xl">
        <FaqForm
          key={isEdit ? faq.id : 'create'}
          initialValues={isEdit ? faq : undefined}
          destinations={destData?.data?.data?.items || []}
          trips={tripData?.data?.data?.items || []}
          isSubmitting={isSubmitting}
          submitLabel={isEdit ? 'Save changes' : 'Create FAQ'}
          onSubmit={(payload) =>
            isEdit ? updateMutation.mutate({ id: faq.id, payload }) : createMutation.mutate(payload)
          }
        />
      </div>
    </div>
  )
}
