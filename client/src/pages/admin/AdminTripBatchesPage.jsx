import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Globe, Ban, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { adminTripBatchApi } from '@/services/tripBatches'
import {
  BATCH_STATUSES,
  BATCH_STATUS_LABELS,
} from '@/schemas/tripBatch'
import { formatDateShort } from '@/lib/dates'

const PAGE_SIZE = 10

const STATUS_BADGE_VARIANT = {
  draft: 'secondary',
  open: 'success',
  full: 'warning',
  closed: 'outline',
  cancelled: 'destructive',
  completed: 'outline',
}

function StatusBadge({ status }) {
  return <Badge variant={STATUS_BADGE_VARIANT[status] || 'secondary'}>{BATCH_STATUS_LABELS[status] || status}</Badge>
}

function PriceCell({ batch }) {
  const hasDiscount = batch.originalPrice != null && batch.discountAmount != null
  return (
    <div className="whitespace-nowrap">
      <span className="font-medium">₹{Number(batch.price).toLocaleString('en-IN')}</span>
      {hasDiscount && (
        <>
          <span className="ml-1.5 text-xs text-muted-foreground line-through">
            ₹{Number(batch.originalPrice).toLocaleString('en-IN')}
          </span>
          <span className="ml-1.5 text-xs text-primary">₹{Number(batch.discountAmount).toLocaleString('en-IN')} off</span>
        </>
      )}
    </div>
  )
}

function SeatsCell({ batch }) {
  return (
    <span className="whitespace-nowrap">
      {batch.totalSeats} / {batch.bookedSeats} /{' '}
      <span className={batch.availableSeats === 0 ? 'text-destructive' : 'text-primary'}>
        {batch.availableSeats}
      </span>
    </span>
  )
}

function DeleteDialog({ batch, open, onOpenChange, onConfirm, deleting }) {
  const blocked = batch && Number(batch.bookedSeats) > 0
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">Delete batch</h2>
          {blocked ? (
            <>
              <p className="mt-2 text-sm text-destructive">
                This batch has {batch.bookedSeats} booked seat(s) and cannot be deleted.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Bookings will reference this batch — mark it closed or completed instead.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete <strong>{batch?.batchCode}</strong>? This cannot be
              undone.
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {!blocked && (
              <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatusDialog({ batch, open, onOpenChange, onConfirm, pending }) {
  const [status, setStatus] = React.useState(batch?.status || 'draft')
  React.useEffect(() => {
    if (batch) setStatus(batch.status)
  }, [batch])

  if (!batch) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">Change status</h2>
          <p className="mt-1 text-sm text-muted-foreground">{batch.batchCode}</p>
          <div className="mt-4">
            <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="New status">
              {BATCH_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {BATCH_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onConfirm(status)} disabled={pending || status === batch.status}>
              {pending ? 'Saving…' : 'Update status'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AdminTripBatchesPage() {
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = React.useState(null)
  const [statusTarget, setStatusTarget] = React.useState(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'trip-batches', { page: 1, limit: PAGE_SIZE }],
    queryFn: () => adminTripBatchApi.list({ page: 1, limit: PAGE_SIZE }),
  })

  const list = data?.data?.data

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'trip-batches'] })
    queryClient.invalidateQueries({ queryKey: ['trips'] })
    queryClient.invalidateQueries({ queryKey: ['home'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
  }

  const publishMutation = useMutation({
    mutationFn: adminTripBatchApi.publish,
    onSuccess: (r) => {
      invalidateAll()
      toast.success(r?.data?.message || 'Batch published')
    },
    onError: (err) => toast.error(err.message || 'Publish failed'),
  })
  const unpublishMutation = useMutation({
    mutationFn: adminTripBatchApi.unpublish,
    onSuccess: (r) => {
      invalidateAll()
      toast.success(r?.data?.message || 'Batch unpublished')
    },
    onError: (err) => toast.error(err.message || 'Unpublish failed'),
  })
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminTripBatchApi.setStatus(id, status),
    onSuccess: () => {
      invalidateAll()
      toast.success('Status updated')
      setStatusTarget(null)
    },
    onError: (err) => toast.error(err.message || 'Status update failed'),
  })
  const deleteMutation = useMutation({
    mutationFn: adminTripBatchApi.remove,
    onSuccess: () => {
      invalidateAll()
      toast.success('Batch deleted')
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(err.message || 'Delete failed'),
  })

  function handleDeleteClick(batch) {
    if (Number(batch.bookedSeats) > 0) {
      toast.error('This batch has booked seats and cannot be deleted')
      return
    }
    setDeleteTarget(batch)
  }

  const actions = (batch) => (
    <BatchActions
      batch={batch}
      onDelete={() => handleDeleteClick(batch)}
      onEdit={() => {}}
      onPublish={() => publishMutation.mutate(batch.id)}
      onUnpublish={() => unpublishMutation.mutate(batch.id)}
      onStatus={() => setStatusTarget(batch)}
    />
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trip Batches</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One departure date per batch, with its own pricing and availability.
          </p>
        </div>
        <Link to="/admin/trip-batches/new">
          <Button>
            <Plus className="h-4 w-4" />
            New batch
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
          Could not load batches. {error?.message || 'Please try again.'}
        </Card>
      ) : list && list.items.length === 0 ? (
        <Card className="p-16 text-center">
          <p className="text-lg font-medium">No batches yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a departure batch to put real dates and prices on a trip.
          </p>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Trip</th>
                  <th className="px-4 py-3 font-medium">Departure</th>
                  <th className="px-4 py-3 font-medium">Return</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Seats T/B/A</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Published</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((b) => (
                  <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{b.batchCode}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/trip-batches/${b.id}/edit`}
                        className="font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        {b.trip?.name || '—'}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {b.trip?.destination?.name || b.trip?.destination?.country || ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateShort(b.departureDate)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateShort(b.returnDate)}</td>
                    <td className="px-4 py-3">
                      <PriceCell batch={b} />
                    </td>
                    <td className="px-4 py-3">
                      <SeatsCell batch={b} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      {b.published ? (
                        <Badge variant="success">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {b.updatedAt ? new Date(String(b.updatedAt).slice(0, 10)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">{actions(b)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {list.items.map((b) => (
              <Card key={b.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{b.batchCode}</span>
                  <StatusBadge status={b.status} />
                  {b.published ? (
                    <Badge variant="success">Published</Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                </div>
                <Link
                  to={`/admin/trip-batches/${b.id}/edit`}
                  className="mt-2 block font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  {b.trip?.name || '—'}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {formatDateShort(b.departureDate)} → {formatDateShort(b.returnDate)} ·{' '}
                  {b.trip?.destination?.name || ''}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <PriceCell batch={b} />
                  <span className="text-muted-foreground">
                    Seats T/B/A: <SeatsCell batch={b} />
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
                  {actions(b)}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <DeleteDialog
        batch={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        deleting={deleteMutation.isPending}
      />

      <StatusDialog
        batch={statusTarget}
        open={!!statusTarget}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        onConfirm={(status) => statusMutation.mutate({ id: statusTarget.id, status })}
        pending={statusMutation.isPending}
      />
    </div>
  )
}

function BatchActions({ batch, onDelete, onPublish, onUnpublish, onStatus }) {
  const btn =
    'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={onStatus} title="Change status" aria-label="Change status" className={btn}>
        <RefreshCw className="h-4 w-4" />
      </button>
      <Link to={`/admin/trip-batches/${batch.id}/edit`} title="Edit" aria-label="Edit" className={btn}>
        <Pencil className="h-4 w-4" />
      </Link>
      {batch.published ? (
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
