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
      description: destination.description || '',
      homepageImage: destination.homepageImage || { url: '', alt: '' },
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

  const deleteMutation = useMutation({
    mutationFn: () => adminDestinationApi.remove(id),
    onSuccess: () => {
      toast.success('Destination deleted')
      queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] })
      navigate('/admin/destinations')
    },
    onError: (err) => toast.error(err.message || 'Delete failed'),
  })

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

  const [moreOpen, setMoreOpen] = React.useState(false)
  const moreRef = React.useRef(null)
  React.useEffect(() => {
    const h = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/admin" className="hover:text-slate-700">Admin</Link>
        <span className="text-slate-400">›</span>
        <Link to="/admin/destinations" className="hover:text-slate-700">Destinations</Link>
        {isEdit && destination?.name && (
          <>
            <span className="text-slate-400">›</span>
            <span className="truncate font-medium text-slate-700">{destination.name}</span>
          </>
        )}
      </div>

      {/* Record Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-4">
        <div className="flex min-w-0 gap-3">
          <div className="hidden h-9 w-9 shrink-0 place-items-center rounded-md border border-amber-200 bg-amber-50 text-amber-700 sm:grid">
            <span className="text-xs font-bold">D</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Destination</p>
            <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">
              {isEdit ? destination?.name || 'Edit Destination' : 'Create Destination'}
            </h1>
            {isEdit && destination && (
              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${destination.published ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${destination.published ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {destination.published ? 'Published' : 'Draft'}
                </span>
                <span>· {destination.country}{destination.region ? ` · ${destination.region}` : ''}</span>
              </p>
            )}
            {!isEdit && <p className="mt-0.5 text-xs text-slate-500">Add a new destination to your website.</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isEdit && destination?.slug && (
            <a href={`/destination/${destination.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Preview
            </a>
          )}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              More <span className="text-xs">▼</span>
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-8 z-20 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                {isEdit && destination?.slug && (
                  <a href={`/destination/${destination.slug}`} target="_blank" rel="noopener noreferrer" className="flex px-3 py-1.5 text-xs hover:bg-slate-50" onClick={() => setMoreOpen(false)}>
                    Preview
                  </a>
                )}
                <button type="button" className="flex w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50" onClick={() => { navigator.clipboard.writeText(destination?.slug || ''); setMoreOpen(false)}}>
                  Duplicate
                </button>
                {isEdit && (
                  <button
                    type="button"
                    className="flex w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setMoreOpen(false)
                      if (window.confirm(`Delete "${destination.name}"? This will remove the destination and its unreferenced media.`)) deleteMutation.mutate()
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
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
        onDelete={
          isEdit
            ? () => {
                if (window.confirm(`Delete "${destination.name}"? This will remove the destination and its unreferenced media.`)) {
                  deleteMutation.mutate()
                }
              }
            : undefined
        }
      />
    </div>
  )
}