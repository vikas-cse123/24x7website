import * as React from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ExternalLink, Globe, Ban, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { adminTripApi } from '@/services/trips'
import { TRIP_TYPE_LABELS } from '@/schemas/trip'

const PAGE_SIZE = 10

function DeleteDialog({ trip, open, onOpenChange, onConfirm, deleting }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">Delete trip</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{trip?.name}</strong>? This
            cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AdminTripsPage() {
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = React.useState(null)
  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState('')
  const [search, setSearch] = React.useState('')

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['admin', 'trips', { page, limit: PAGE_SIZE, search: search || undefined }],
    queryFn: () =>
      adminTripApi.list({
        page,
        limit: PAGE_SIZE,
        ...(search ? { search } : {}),
      }),
    placeholderData: (prev) => prev,
  })

  const list = data?.data?.data
  const isInitialLoading = isLoading && !data

  React.useEffect(() => {
    if (list && list.page !== page) setPage(list.page)
  }, [list?.page])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'trips'] })

  const publishMutation = useMutation({
    mutationFn: adminTripApi.publish,
    onSuccess: () => { toast.success('Trip published'); invalidate() },
    onError: (err) => toast.error(err.message || 'Publish failed'),
  })

  const unpublishMutation = useMutation({
    mutationFn: adminTripApi.unpublish,
    onSuccess: () => { toast.success('Trip unpublished'); invalidate() },
    onError: (err) => toast.error(err.message || 'Unpublish failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminTripApi.remove,
    onSuccess: () => { toast.success('Trip deleted'); setDeleteTarget(null); invalidate() },
    onError: (err) => toast.error(err.message || 'Delete failed'),
  })

  function handleDeleteClick(trip) {
    if (trip.published) {
      toast.error('Unpublish this trip before deleting it')
      return
    }
    setDeleteTarget(trip)
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Admin</span>
        <span className="text-slate-400">›</span>
        <span className="font-medium text-slate-700">Trips</span>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-[22px]">Trips</h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-[13px]">Manage trips. Publish to make them visible.</p>
          </div>
          {isFetching && list && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" aria-hidden="true" />
              Refreshing
            </span>
          )}
        </div>
        <Link to="/admin/trips/new">
          <Button size="sm" className="h-9 min-w-[110px] rounded-md bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" /> New trip
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <Input placeholder="Search trips..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="h-9 pl-8 text-xs focus-visible:ring-1 focus-visible:ring-slate-900 focus-visible:ring-offset-0 focus-visible:border-slate-900" />
        </div>
      </div>

      {isError && list && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Could not refresh trips. Showing cached data.
        </div>
      )}
      {isInitialLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-md bg-slate-100" />
          ))}
        </div>
      ) : isError && !list ? (
        <Card className="border-red-200 bg-red-50 p-3 text-xs text-red-700">Could not load trips. {error?.message || 'Please try again.'}</Card>
      ) : !list || list.items.length === 0 ? (
        <Card className="flex min-h-[170px] flex-col items-center justify-center border-slate-200 bg-white px-6 py-8 text-center">
          <p className="text-[14px] font-semibold text-slate-900">{search ? `No results for "${search}"` : 'No trips yet'}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">Create your first trip to get started.</p>
        </Card>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="w-10 px-2 py-2"></th>
                    <th className="px-2 py-2">Trip</th>
                    <th className="px-2 py-2">Destination</th>
                    <th className="px-2 py-2">Duration</th>
                    <th className="px-2 py-2">Price</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.items.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-2 py-1.5">
                        <DestinationImage src={t.cardImage?.url || t.heroImage?.url} alt={t.name} className="h-7 w-10 shrink-0 rounded border border-slate-200" />
                      </td>
                      <td className="px-2 py-1.5">
                        <Link to={`/admin/trips/${t.id}/edit`} className="font-medium text-slate-900 hover:underline">
                          {t.name}
                        </Link>
                        <p className="font-mono text-xs text-slate-500">/{t.slug}</p>
                      </td>
                      <td className="px-2 py-1.5 text-slate-600">{t.destination?.name || '—'}</td>
                      <td className="px-2 py-1.5 text-slate-600">
                        {t.durationDays}D/{t.durationNights}N
                      </td>
                      <td className="px-2 py-1.5 font-medium">{t.startingPrice != null ? `₹${Number(t.startingPrice).toLocaleString('en-IN')}` : '—'}</td>
                      <td className="px-2 py-1.5">
                        {t.published ? (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">Published</span>
                        ) : (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">Draft</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <TripsActionMenu trip={t} onDelete={() => handleDeleteClick(t)} onPublish={() => publishMutation.mutate(t.id)} onUnpublish={() => unpublishMutation.mutate(t.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {(() => {
              const isFiltered = !!search
              const start = (list.page - 1) * PAGE_SIZE + 1
              const end = Math.min(list.page * PAGE_SIZE, list.total)
              return <span className="text-slate-600">Showing {start}–{end} of {list.total}{isFiltered ? ' filtered' : ''}</span>
            })()}
            {list.totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={list.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {(() => {
                  const pages = []
                  const total = list.totalPages
                  const current = list.page
                  const btn = (p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`grid h-7 min-w-7 place-items-center rounded px-2 text-xs ${p === current ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white hover:bg-slate-50'}`}
                    >
                      {p}
                    </button>
                  )
                  if (total <= 7) {
                    for (let p = 1; p <= total; p++) pages.push(btn(p))
                  } else {
                    pages.push(btn(1))
                    if (current > 3) pages.push(<span key="e1" className="px-1 text-slate-400">…</span>)
                    const start = Math.max(2, Math.min(current - 1, total - 4))
                    const end = Math.min(total - 1, Math.max(current + 1, 4))
                    for (let p = start; p <= end; p++) pages.push(btn(p))
                    if (current < total - 2) pages.push(<span key="e2" className="px-1 text-slate-400">…</span>)
                    pages.push(btn(total))
                  }
                  return pages
                })()}
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={list.page >= list.totalPages} onClick={() => setPage((p) => Math.min(list.totalPages, p + 1))} aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <DeleteDialog
        trip={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        deleting={deleteMutation.isPending}
      />
    </div>
  )
}

function TripsActionMenu({ trip, onDelete, onPublish, onUnpublish }) {
  const [open, setOpen] = React.useState(false)
  const [pos, setPos] = React.useState(null)
  const ref = React.useRef(null)
  const menuRef = React.useRef(null)

  // Position the menu in viewport coordinates so it escapes the table's
  // scroll container. Opens downward when space allows, otherwise upward.
  const updatePosition = React.useCallback(() => {
    const btn = ref.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const menuW = 160 // w-40
    const menuH = menuRef.current ? menuRef.current.offsetHeight : 180
    const gap = 4
    const spaceBelow = window.innerHeight - r.bottom
    const spaceAbove = r.top
    const openUp = spaceBelow < menuH + gap + 8 && spaceAbove > menuH + gap + 8
    const top = openUp ? Math.max(8, r.top - menuH - gap) : r.bottom + gap
    const left = Math.max(8, Math.min(r.right - menuW, window.innerWidth - menuW - 8))
    setPos({ top, left })
  }, [])

  // Measure with the real menu height before paint so the first frame is placed correctly.
  React.useLayoutEffect(() => {
    if (open) updatePosition()
  }, [open, updatePosition])

  React.useEffect(() => {
    if (!open) return undefined
    const onScrollResize = () => updatePosition()
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    const h = (e) => {
      if (ref.current && ref.current.contains(e.target)) return
      if (menuRef.current && menuRef.current.contains(e.target)) return
      setOpen(false)
    }
    window.addEventListener('scroll', onScrollResize, true)
    window.addEventListener('resize', onScrollResize)
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScrollResize, true)
      window.removeEventListener('resize', onScrollResize)
      document.removeEventListener('mousedown', h)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, updatePosition])
  return (
    <div className="relative inline-block" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="Trip actions" className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ position: 'fixed', top: pos ? pos.top : -9999, left: pos ? pos.left : -9999, zIndex: 50, visibility: pos ? 'visible' : 'hidden' }}
          className="w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <Link to={`/admin/trips/${trip.id}/edit`} className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50" onClick={() => setOpen(false)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
          <a href={`/trip/${trip.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50" onClick={() => setOpen(false)}>
            <ExternalLink className="h-3.5 w-3.5" /> Preview
          </a>
          {trip.published ? (
            <button type="button" className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50" onClick={() => { onUnpublish(); setOpen(false)}}>
              <Ban className="h-3.5 w-3.5" /> Unpublish
            </button>
          ) : (
            <button type="button" className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50" onClick={() => { onPublish(); setOpen(false)}}>
              <Globe className="h-3.5 w-3.5" /> Publish
            </button>
          )}
          <div className="my-1 border-t border-slate-100" />
          <button type="button" className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50" onClick={() => { onDelete(); setOpen(false)}}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}
function AdminActions(props) { return <TripsActionMenu {...props} /> }