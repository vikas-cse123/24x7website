import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ExternalLink, Globe, Ban } from 'lucide-react'
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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'trips', { page: 1, limit: PAGE_SIZE }],
    queryFn: () => adminTripApi.list({ page: 1, limit: PAGE_SIZE }),
  })

  const list = data?.data?.data

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

  const [search, setSearch] = React.useState('')
  const filtered = React.useMemo(() => {
    if (!list?.items) return []
    if (!search.trim()) return list.items
    const q = search.toLowerCase()
    return list.items.filter((t) => `${t.name} ${t.slug} ${t.tripCode} ${t.destination?.name || ''}`.toLowerCase().includes(q))
  }, [list, search])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Trips</h1>
          <p className="text-xs text-slate-500">Manage trips. Publish to make them visible.</p>
        </div>
        <Link to="/admin/trips/new">
          <Button size="sm" className="h-7 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800">
            <Plus className="h-3.5 w-3.5" /> New trip
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <Input placeholder="Search trips..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-7 pl-8 text-xs" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-md bg-slate-100" />
          ))}
        </div>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50 p-3 text-xs text-red-700">Could not load trips. {error?.message || 'Please try again.'}</Card>
      ) : list && filtered.length === 0 ? (
        <Card className="border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold">{search ? `No results for "${search}"` : 'No trips yet'}</p>
          <p className="mt-1 text-xs text-slate-500">Create your first trip to get started.</p>
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
                    <th className="px-2 py-2">Code</th>
                    <th className="px-2 py-2">Destination</th>
                    <th className="px-2 py-2">Duration</th>
                    <th className="px-2 py-2">Price</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-2 py-1.5">
                        <DestinationImage src={t.heroImage?.url} alt={t.name} className="h-7 w-10 shrink-0 rounded border border-slate-200" />
                      </td>
                      <td className="px-2 py-1.5">
                        <Link to={`/admin/trips/${t.id}/edit`} className="font-medium text-slate-900 hover:underline">
                          {t.name}
                        </Link>
                        <p className="font-mono text-xs text-slate-500">/{t.slug}</p>
                      </td>
                      <td className="px-2 py-1.5 font-mono text-xs text-slate-500">{t.tripCode}</td>
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
  const ref = React.useRef(null)
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
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
        </div>
      )}
    </div>
  )
}
function AdminActions(props) { return <TripsActionMenu {...props} /> }