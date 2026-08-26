import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Globe, Ban, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { adminBlogApi } from '@/services/blogs'
import { BLOG_CATEGORY_LABELS } from '@/schemas/blog'
import { formatDateLong } from '@/lib/dates'

const PAGE_SIZE = 12

function ConfirmDialog({ open, onOpenChange, title, body, confirmLabel, danger = true, onConfirm, pending }) {
  if (!open) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant={danger ? 'destructive' : 'default'} onClick={onConfirm} disabled={pending}>
              {pending ? 'Working…' : confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AdminBlogsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = React.useState(1)
  const [deleteTarget, setDeleteTarget] = React.useState(null)
  const [featureTarget, setFeatureTarget] = React.useState(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'blogs', { page, limit: PAGE_SIZE }],
    queryFn: () => adminBlogApi.list({ page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  })
  const list = data?.data?.data

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'blogs'] })
    queryClient.invalidateQueries({ queryKey: ['blogs'] })
    queryClient.invalidateQueries({ queryKey: ['home'] })
  }

  const publishMutation = useMutation({
    mutationFn: ({ id, published }) =>
      published ? adminBlogApi.unpublish(id) : adminBlogApi.publish(id),
    onSuccess: (res) => {
      toast.success(res?.data?.message || 'Updated')
      invalidate()
    },
    onError: (err) => toast.error(err.message || 'Failed'),
  })
  const featureMutation = useMutation({
    mutationFn: async ({ id }) => {
      // Feature toggle = PATCH featured flag via update endpoint.
      const current = await adminBlogApi.getById(id).then((r) => r.data.data)
      return adminBlogApi.update(id, { ...pickUpdatable(current), featured: !current.featured })
    },
    onSuccess: (res) => {
      toast.success(res?.data?.featured ? 'Marked as featured' : 'Removed from featured')
      setFeatureTarget(null)
      invalidate()
    },
    onError: (err) => toast.error(err.message || 'Failed'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => adminBlogApi.remove(id),
    onSuccess: () => {
      toast.success('Blog deleted')
      setDeleteTarget(null)
      invalidate()
    },
    onError: (err) => toast.error(err.message || 'Delete failed'),
  })

  function pickUpdatable(b) {
    if (!b) return {}
    return {
      title: b.title,
      excerpt: b.excerpt,
      content: b.content,
      coverImage: b.coverImage || {},
      category: b.category,
      tags: b.tags || [],
      destinationId: b.destinationId || null,
      seoTitle: b.seoTitle || '',
      seoDescription: b.seoDescription || '',
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Travel Blogs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Write, publish and feature travel stories.
          </p>
        </div>
        <Link to="/admin/blogs/new">
          <Button>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New blog
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/40 p-6 text-sm text-destructive">
          Could not load blogs. {error?.message || 'Please try again.'}
        </Card>
      ) : list && list.items.length === 0 ? (
        <Card className="p-16 text-center">
          <p className="text-lg font-medium">No blogs yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Write your first travel story.</p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {list.items.map((b) => (
              <Card key={b.id} className="p-4">
                <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap">
                  <DestinationImage
                    src={b.coverImage?.url}
                    alt={b.title}
                    className="hidden h-14 w-20 shrink-0 rounded-lg sm:block"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/admin/blogs/${b.id}/edit`}
                      className="font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      {b.title}
                    </Link>
                    <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">/{b.slug}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {b.category && (BLOG_CATEGORY_LABELS[b.category] || b.category)} ·{' '}
                      {b.readingTime} min read ·{' '}
                      {b.published
                        ? `Published ${formatDateLong(b.publishedAt || b.updatedAt)}`
                        : 'Draft'}
                      {b.destination?.name ? ` · ${b.destination.name}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {b.featured && <Badge>Featured</Badge>}
                    {b.published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <IconAction label={b.featured ? 'Remove from featured' : 'Mark as featured'} onClick={() => setFeatureTarget(b)}>
                      <Star className={`h-4 w-4 ${b.featured ? 'fill-amber-400 text-amber-400' : ''}`} aria-hidden="true" />
                    </IconAction>
                    <IconAction
                      label={b.published ? 'Unpublish' : 'Publish'}
                      onClick={() => publishMutation.mutate({ id: b.id, published: b.published })}
                    >
                      {b.published ? <Ban className="h-4 w-4" aria-hidden="true" /> : <Globe className="h-4 w-4" aria-hidden="true" />}
                    </IconAction>
                    <Link to={`/admin/blogs/${b.id}/edit`}>
                      <IconAction label="Edit"><Pencil className="h-4 w-4" aria-hidden="true" /></IconAction>
                    </Link>
                    <IconAction label="Delete" danger onClick={() => setDeleteTarget(b)}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </IconAction>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {list.totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" disabled={list.page <= 1} onClick={() => setPage(list.page - 1)} aria-label="Previous page">
                ‹
              </Button>
              <span className="text-sm text-muted-foreground">Page {list.page} of {list.totalPages}</span>
              <Button variant="outline" size="icon" disabled={list.page >= list.totalPages} onClick={() => setPage(list.page + 1)} aria-label="Next page">
                ›
              </Button>
            </nav>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete blog"
        body={`Permanently delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete blog"
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        pending={deleteMutation.isPending}
      />
      <ConfirmDialog
        open={!!featureTarget}
        onOpenChange={(o) => !o && setFeatureTarget(null)}
        title={featureTarget?.featured ? 'Remove from featured' : 'Mark as featured'}
        body={
          featureTarget?.featured
            ? `"${featureTarget?.title}" will no longer be highlighted as featured.`
            : `"${featureTarget?.title}" will be highlighted as a featured story.`
        }
        confirmLabel={featureTarget?.featured ? 'Remove' : 'Feature'}
        danger={false}
        onConfirm={() => featureMutation.mutate({ id: featureTarget.id })}
        pending={featureMutation.isPending}
      />
    </div>
  )
}

function IconAction({ label, onClick, danger, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        danger ? 'text-destructive hover:bg-destructive/10' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
