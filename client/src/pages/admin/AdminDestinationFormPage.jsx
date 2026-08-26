import * as React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { DestinationForm } from '@/components/admin/DestinationForm'
import { adminDestinationApi } from '@/services/destinations'

function preparePayload(values) {
  // Slug empty means "auto-generate from name" on the server.
  const payload = { ...values }
  if (!payload.slug) delete payload.slug
  return payload
}

export function AdminDestinationFormPage({ mode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const isEdit = mode === 'edit'

  const { data: editData, isLoading: loadingEdit } = useQuery({
    queryKey: ['admin', 'destinations', id],
    queryFn: () => adminDestinationApi.getById(id),
    enabled: isEdit && !!id,
  })

  const createMutation = useMutation({
    mutationFn: (values) => adminDestinationApi.create(values),
    onSuccess: () => {
      toast.success('Destination created')
      queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] })
      navigate('/admin/destinations')
    },
    onError: (err) => toast.error(err.message || 'Create failed'),
  })

  const updateMutation = useMutation({
    mutationFn: (values) => adminDestinationApi.update(id, values),
    onSuccess: () => {
      toast.success('Destination updated')
      queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] })
      navigate('/admin/destinations')
    },
    onError: (err) => toast.error(err.message || 'Update failed'),
  })

  const destination = editData?.data?.data

  const initialValues = React.useMemo(() => {
    if (!isEdit) return undefined
    if (!destination) return undefined
    return {
      name: destination.name,
      slug: destination.slug,
      country: destination.country,
      region: destination.region || '',
      type: destination.type || 'other',
      category: destination.category || 'other',
      shortDescription: destination.shortDescription || '',
      description: destination.description || '',
      heroImage: destination.heroImage || { url: '', alt: '' },
      gallery: destination.gallery || [],
      startingPrice: destination.startingPrice ?? null,
      currency: destination.currency || 'INR',
      featured: !!destination.featured,
      published: !!destination.published,
      displayOrder: destination.displayOrder || 0,
      seoTitle: destination.seoTitle || '',
      seoDescription: destination.seoDescription || '',
      seoKeywords: destination.seoKeywords || '',
    }
  }, [isEdit, destination])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  if (isEdit && loadingEdit) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (isEdit && !destination) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Destination not found</p>
        <Link
          to="/admin/destinations"
          className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to destinations
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/admin/destinations"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <ArrowLeft className="h-4 w-4" />
          Destinations
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {isEdit ? `Edit ${destination.name}` : 'New destination'}
        </h1>
      </div>

      <DestinationForm
        key={isEdit ? destination.id : 'create'}
        initialValues={initialValues}
        isSubmitting={isSubmitting}
        submitLabel={isEdit ? 'Save changes' : 'Create destination'}
        onSubmit={(values) => {
          const payload = preparePayload(values)
          if (isEdit) updateMutation.mutate(payload)
          else createMutation.mutate(payload)
        }}
      />
    </div>
  )
}