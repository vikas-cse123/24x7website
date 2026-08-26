import * as React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { BlogForm } from '@/components/admin/BlogForm'
import { adminBlogApi } from '@/services/blogs'
import { destinationApi } from '@/services/destinations'

function preparePayload(values) {
  const payload = { ...values }
  if (!payload.slug) delete payload.slug
  return payload
}

export function AdminBlogFormPage({ mode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = mode === 'edit'

  const { data: destData } = useQuery({
    queryKey: ['destinations', { page: 1, limit: 50 }],
    queryFn: () => destinationApi.list({ page: 1, limit: 50 }),
  })
  const destinations = destData?.data?.data?.items || []

  const { data: editData, isLoading: loadingEdit } = useQuery({
    queryKey: ['admin', 'blogs', id],
    queryFn: () => adminBlogApi.getById(id),
    enabled: isEdit && !!id,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'blogs'] })
    queryClient.invalidateQueries({ queryKey: ['blogs'] })
    queryClient.invalidateQueries({ queryKey: ['home'] })
  }

  const createMutation = useMutation({
    mutationFn: (payload) => adminBlogApi.create(payload),
    onSuccess: (res) => {
      toast.success('Blog created')
      invalidate()
      navigate('/admin/blogs')
    },
    onError: (err) => toast.error(err.message || 'Create failed'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => adminBlogApi.update(id, payload),
    onSuccess: () => {
      toast.success('Blog updated')
      invalidate()
      navigate('/admin/blogs')
    },
    onError: (err) => toast.error(err.message || 'Update failed'),
  })

  const blog = editData?.data?.data
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  if (isEdit && loadingEdit) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }
  if (isEdit && !blog) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Blog not found</p>
        <Link to="/admin/blogs" className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to blogs
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/admin/blogs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <ArrowLeft className="h-4 w-4" />
        Blogs
      </Link>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">
        {isEdit ? `Edit blog` : 'New travel blog'}
      </h1>

      <div className="mt-6 max-w-3xl">
        <BlogForm
          key={isEdit ? blog.id : 'create'}
          initialValues={isEdit ? blog : undefined}
          destinations={destinations}
          isSubmitting={isSubmitting}
          submitLabel={isEdit ? 'Save changes' : 'Create blog'}
          onSubmit={(payload) =>
            isEdit ? updateMutation.mutate({ id: blog.id, payload }) : createMutation.mutate(payload)
          }
        />
      </div>
    </div>
  )
}
