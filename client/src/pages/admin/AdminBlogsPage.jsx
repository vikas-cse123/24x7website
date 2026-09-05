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

  const [search, setSearch] = React.useState('')
  const filtered = React.useMemo(() => {
    if (!list?.items) return []
    if (!search.trim()) return list.items
    const q = search.toLowerCase()
    return list.items.filter((b) => `${b.title} ${b.slug} ${b.category}`.toLowerCase().includes(q))
  }, [list, search])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Blogs</h1>
          <p className="text-xs text-slate-500">Write, publish and feature travel stories.</p>
        </div>
        <Link to="/admin/blogs/new">
          <Button size="sm" className="h-7 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800">
            <Plus className="h-3.5 w-3.5" /> New blog
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input
            placeholder="Search blogs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-md bg-slate-100" />
          ))}
        </div>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50 p-3 text-xs text-red-700">Could not load blogs. {error?.message || 'Please try again.'}</Card>
      ) : list && filtered.length === 0 ? (
        <Card className="border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold">{search ? `No results for "${search}"` : 'No blogs yet'}</p>
          <p className="mt-1 text-xs text-slate-500">Write your first travel story.</p>
        </Card>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="w-10 px-2 py-2"></th>
                    <th className="px-2 py-2">Title</th>
                    <th className="px-2 py-2">Category</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-2 py-1.5">
                        <DestinationImage src={b.coverImage?.url} alt={b.title} className="h-7 w-10 shrink-0 rounded border border-slate-200" />
                      </td>
                      <td className="px-2 py-1.5">
                        <Link to={`/admin/blogs/${b.id}/edit`} className="font-medium text-slate-900 hover:underline">
                          {b.title}
                        </Link>
                        <p className="font-mono text-xs text-slate-500">/{b.slug} · {b.readingTime} min</p>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium capitalize text-slate-600">{b.category}</span>
                      </td>
                      <td className="px-2 py-1.5">
                        {b.published ? (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">Published</span>
                        ) : (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">Draft</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => setFeatureTarget(b)} className={`grid h-7 w-7 place-items-center rounded-md ${b.featured ? 'text-amber-500' : 'text-slate-400 hover:bg-slate-100'}`}>
                            <Star className={`h-3.5 w-3.5 ${b.featured ? 'fill-amber-400' : ''}`} />
                          </button>
                          <button type="button" onClick={() => publishMutation.mutate({ id: b.id, published: b.published })} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100">
                            {b.published ? <Ban className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                          </button>
                          <Link to={`/admin/blogs/${b.id}/edit`} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100">
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <button type="button" onClick={() => setDeleteTarget(b)} className="grid h-7 w-7 place-items-center rounded-md text-red-500 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {list.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 text-xs">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={list.page <= 1} onClick={() => setPage(list.page - 1)}>
                Previous
              </Button>
              <span className="text-xs text-slate-500">
                Page {list.page} of {list.totalPages}
              </span>
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={list.page >= list.totalPages} onClick={() => setPage(list.page + 1)}>
                Next
              </Button>
            </div>
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
