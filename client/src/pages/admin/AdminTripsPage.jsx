import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ExternalLink, Globe, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trips</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage trips. Publish to make them visible on the public site.
          </p>
        </div>
        <Link to="/admin/trips/new">
          <Button>
            <Plus className="h-4 w-4" />
            New trip
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/40 p-6 text-sm text-destructive">
          Could not load trips. {error?.message || 'Please try again.'}
        </Card>
      ) : list && list.items.length === 0 ? (
        <Card className="p-16 text-center">
          <p className="text-lg font-medium">No trips yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first trip to get started.
          </p>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Trip</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Destination</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Featured</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <DestinationImage src={t.heroImage?.url} alt={t.name} className="h-10 w-14 shrink-0 rounded-md" />
                        <div>
                          <Link
                            to={`/admin/trips/${t.id}/edit`}
                            className="font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                          >
                            {t.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">/{t.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.tripCode}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.destination?.name || '—'}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{TRIP_TYPE_LABELS[t.tripType] || t.tripType}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.durationDays}D / {t.durationNights}N</td>
                    <td className="px-4 py-3">
                      {t.startingPrice !== null && t.startingPrice !== undefined
                        ? `₹${t.startingPrice.toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {t.published ? <Badge variant="success">Published</Badge> : <Badge variant="secondary">Draft</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      {t.featured ? <Badge variant="warning">Featured</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <AdminActions
                          trip={t}
                          onDelete={() => handleDeleteClick(t)}
                          onPublish={() => publishMutation.mutate(t.id)}
                          onUnpublish={() => unpublishMutation.mutate(t.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {list.items.map((t) => (
              <Card key={t.id} className="p-4">
                <div className="flex items-center gap-3">
                  <DestinationImage src={t.heroImage?.url} alt={t.name} className="h-12 w-16 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/trips/${t.id}/edit`} className="font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                      {t.name}
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">{t.tripCode} · {t.destination?.name || '—'}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {t.published ? <Badge variant="success">Published</Badge> : <Badge variant="secondary">Draft</Badge>}
                      {t.featured && <Badge variant="warning">Featured</Badge>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-1">
                  <AdminActions
                    trip={t}
                    onDelete={() => handleDeleteClick(t)}
                    onPublish={() => publishMutation.mutate(t.id)}
                    onUnpublish={() => unpublishMutation.mutate(t.id)}
                  />
                </div>
              </Card>
            ))}
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

function AdminActions({ trip, onDelete, onPublish, onUnpublish }) {
  const btn =
    'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  return (
    <div className="flex items-center gap-1">
      <a href={`/trip/${trip.slug}`} target="_blank" rel="noopener noreferrer" title="View public page" aria-label="View public page" className={btn}>
        <ExternalLink className="h-4 w-4" />
      </a>
      <Link to={`/admin/trips/${trip.id}/edit`} title="Edit" aria-label="Edit" className={btn}>
        <Pencil className="h-4 w-4" />
      </Link>
      {trip.published ? (
        <button type="button" onClick={onUnpublish} title="Unpublish" aria-label="Unpublish" className={btn}>
          <Ban className="h-4 w-4" />
        </button>
      ) : (
        <button type="button" onClick={onPublish} title="Publish" aria-label="Publish" className={btn}>
          <Globe className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        aria-label="Delete"
        className={`${btn} hover:bg-destructive/10 hover:text-destructive`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}