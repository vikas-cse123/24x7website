import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ExternalLink, Globe, Ban, Search, MoreVertical, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { adminDestinationApi } from '@/services/destinations'

const PAGE_SIZE = 10

function DeleteDialog({ destination, open, onOpenChange, onConfirm, deleting }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div className="p-5">
          <h2 className="text-sm font-bold">Delete “{destination?.name}”?</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            This will permanently remove the destination and its unreferenced media. This cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={onConfirm} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ActionMenu({ destination, onDelete, onPublish, onUnpublish }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)
  React.useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label="Actions"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <Link
            to={`/admin/destinations/${destination.id}/edit`}
            className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
          <a
            href={`/destination/${destination.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Preview
          </a>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50"
            onClick={() => {
              navigator.clipboard.writeText(destination.slug)
              toast.success('Slug copied')
              setOpen(false)
            }}
          >
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </button>
          {destination.published ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50"
              onClick={() => {
                onUnpublish()
                setOpen(false)
              }}
            >
              <Ban className="h-3.5 w-3.5" /> Unpublish
            </button>
          ) : (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50"
              onClick={() => {
                onPublish()
                setOpen(false)
              }}
            >
              <Globe className="h-3.5 w-3.5" /> Publish
            </button>
          )}
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
            onClick={() => {
              onDelete()
              setOpen(false)
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

export function AdminDestinationsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = React.useState(1)
  const [deleteTarget, setDeleteTarget] = React.useState(null)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [categoryFilter, setCategoryFilter] = React.useState('all')
  const [selected, setSelected] = React.useState(() => new Set())

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'destinations', { page, limit: PAGE_SIZE }],
    queryFn: () => adminDestinationApi.list({ page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  })

  const list = data?.data?.data

  React.useEffect(() => {
    if (list && list.page !== page) setPage(list.page)
  }, [list?.page])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] })

  const publishMutation = useMutation({
    mutationFn: adminDestinationApi.publish,
    onSuccess: () => { toast.success('Destination published'); invalidate() },
    onError: (err) => toast.error(err.message || 'Publish failed'),
  })
  const unpublishMutation = useMutation({
    mutationFn: adminDestinationApi.unpublish,
    onSuccess: () => { toast.success('Destination unpublished'); invalidate() },
    onError: (err) => toast.error(err.message || 'Unpublish failed'),
  })
  const deleteMutation = useMutation({
    mutationFn: adminDestinationApi.remove,
    onSuccess: () => { toast.success('Destination deleted'); setDeleteTarget(null); invalidate() },
    onError: (err) => toast.error(err.message || 'Delete failed'),
  })

  const filtered = React.useMemo(() => {
    if (!list?.items) return []
    return list.items.filter((d) => {
      if (search && !`${d.name} ${d.slug} ${d.country}`.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter !== 'all') {
        if (statusFilter === 'published' && !d.published) return false
        if (statusFilter === 'draft' && d.published) return false
      }
      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false
      return true
    })
  }, [list, search, statusFilter, categoryFilter])

  const allSelected = filtered.length > 0 && filtered.every((d) => selected.has(d.id))
  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(filtered.map((d) => d.id)))
  }
  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const bulkPublish = async () => {
    for (const id of selected) {
      try { await adminDestinationApi.publish(id) } catch {}
    }
    setSelected(new Set())
    invalidate()
    toast.success(`${selected.size} published`)
  }
  const bulkUnpublish = async () => {
    for (const id of selected) {
      try { await adminDestinationApi.unpublish(id) } catch {}
    }
    setSelected(new Set())
    invalidate()
    toast.success(`${selected.size} unpublished`)
  }
  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} destinations? This cannot be undone.`)) return
    for (const id of selected) {
      try { await adminDestinationApi.remove(id) } catch {}
    }
    setSelected(new Set())
    invalidate()
    toast.success(`${selected.size} deleted`)
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Destinations</h1>
          <p className="text-xs text-slate-500">Manage destinations and publish them to the website.</p>
        </div>
        <Link to="/admin/destinations/new">
          <Button size="sm" className="h-7 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800">
            <Plus className="h-3.5 w-3.5" /> New Destination
          </Button>
        </Link>
      </div>

      {/* Search + Filters */}
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-amber-50 px-3 py-2 text-xs">
          <span className="font-semibold text-slate-900">{selected.size} selected</span>
          <div className="ml-2 flex gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={bulkPublish}>
              Publish
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={bulkUnpublish}>
              Unpublish
            </Button>
            <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={bulkDelete}>
              Delete
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search destinations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 pl-8 text-xs"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-7 text-xs">
            <option value="all">All status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </Select>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-7 text-xs">
            <option value="all">All categories</option>
            <option value="international">International</option>
            <option value="domestic">Domestic</option>
            <option value="weekend">Weekend</option>
            <option value="other">Other</option>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-md bg-slate-100" />
          ))}
        </div>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50 p-3 text-xs text-red-700">Could not load destinations. {error?.message || 'Please try again.'}</Card>
      ) : !list || filtered.length === 0 ? (
        <Card className="border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold">{search || statusFilter !== 'all' || categoryFilter !== 'all' ? 'No matching destinations' : 'No destinations yet'}</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            {search ? `No results for "${search}"` : 'Create your first destination to start showing destinations on the website.'}
          </p>
          {!search && (
            <Link to="/admin/destinations/new" className="mt-3 inline-flex">
              <Button size="sm" className="h-7 text-xs">
                <Plus className="h-3.5 w-3.5" /> Create Destination
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="min-h-[320px] max-h-[65vh] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="w-8 px-2 py-2">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-3.5 w-3.5 rounded border-slate-300" />
                    </th>
                    <th className="w-10 px-2 py-2"></th>
                    <th className="px-2 py-2">Destination</th>
                    <th className="px-2 py-2">Country</th>
                    <th className="px-2 py-2">Category</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Featured</th>
                    <th className="px-2 py-2 text-right">Updated</th>
                    <th className="px-2 py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((d) => (
                    <tr key={d.id} className={`hover:bg-slate-50 ${selected.has(d.id) ? 'bg-amber-50/60' : ''}`}>
                      <td className="px-2 py-2">
                        <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleOne(d.id)} className="h-3.5 w-3.5 rounded border-slate-300" />
                      </td>
                      <td className="px-2 py-2">
                        <DestinationImage src={d.homepageImage?.url || d.heroImage?.url} alt={d.name} className="h-8 w-12 shrink-0 rounded border border-slate-200" />
                      </td>
                      <td className="px-2 py-2">
                        <Link to={`/admin/destinations/${d.id}/edit`} className="text-sm font-medium text-slate-900 hover:underline">
                          {d.name}
                        </Link>
                        <p className="font-mono text-xs text-slate-500">/{d.slug}</p>
                      </td>
                      <td className="px-2 py-2 text-slate-600">{d.country}</td>
                      <td className="px-2 py-2">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium capitalize text-slate-600">{d.category}</span>
                      </td>
                      <td className="px-2 py-2">
                        {d.published ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Published
                          </span>
                        ) : (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">Draft</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {d.featured ? <span className="text-amber-600">★</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-2 py-2 text-right text-slate-500">{new Date(d.updatedAt).toLocaleDateString()}</td>
                      <td className="px-2 py-2 text-right">
                        <ActionMenu
                          destination={d}
                          onDelete={() => setDeleteTarget(d)}
                          onPublish={() => publishMutation.mutate(d.id)}
                          onUnpublish={() => unpublishMutation.mutate(d.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Showing {filtered.length} of {list.total} {search || statusFilter !== 'all' || categoryFilter !== 'all' ? '(filtered)' : ''} {list.totalPages > 1 ? `• Page ${list.page}/${list.totalPages}` : ''}
            </span>
            {list.totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={list.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <span className="px-2 text-xs">
                  {list.page} / {list.totalPages}
                </span>
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={list.page >= list.totalPages} onClick={() => setPage((p) => Math.min(list.totalPages, p + 1))}>
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <DeleteDialog destination={deleteTarget} open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} deleting={deleteMutation.isPending} />
    </div>
  )
}
