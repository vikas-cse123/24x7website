import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Trash2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { StarRating } from '@/components/reviews/StarRating'
import { adminReviewApi } from '@/services/reviews'
import { formatDateLong } from '@/lib/dates'

const STATUS_BADGE = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
}

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export function AdminReviewsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = React.useState('')
  const [moderating, setModerating] = React.useState(null) // {review, status}
  const [deleteTarget, setDeleteTarget] = React.useState(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'reviews', { page: 1, limit: 20, status: statusFilter || undefined }],
    queryFn: () =>
      adminReviewApi.list({ page: 1, limit: 20, ...(statusFilter ? { status: statusFilter } : {}) }),
    placeholderData: (prev) => prev,
  })

  const list = data?.data?.data

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    queryClient.invalidateQueries({ queryKey: ['reviews'] })
  }

  const moderateMutation = useMutation({
    mutationFn: ({ id, status }) => adminReviewApi.setStatus(id, status),
    onSuccess: (res) => {
      toast.success(res?.data?.message || 'Review moderated')
      setModerating(null)
      invalidate()
    },
    onError: (err) => toast.error(err.message || 'Moderation failed'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => adminReviewApi.remove(id),
    onSuccess: () => {
      toast.success('Review deleted')
      setDeleteTarget(null)
      invalidate()
    },
    onError: (err) => toast.error(err.message || 'Delete failed'),
  })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Moderate traveller reviews. Only approved reviews appear publicly.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by moderation status">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              aria-pressed={statusFilter === f.value}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                statusFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/40 p-6 text-sm text-destructive">
          Could not load reviews. {error?.message || 'Please try again.'}
        </Card>
      ) : list && list.items.length === 0 ? (
        <Card className="p-16 text-center">
          <p className="text-lg font-medium">No {statusFilter || ''} reviews</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Traveller submissions will appear here for moderation.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {list.items.map((r) => (
            <Card key={r.id} className="flex flex-col p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-muted-foreground">{r.trip?.name}</p>
                  <h3 className="mt-0.5 font-semibold leading-snug">{r.title}</h3>
                </div>
                <Badge variant={STATUS_BADGE[r.status] || 'secondary'}>{r.status}</Badge>
              </div>
              <StarRating value={r.rating} className="mt-2" />
              <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{r.text}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {r.travellerName || r.authorName} · {formatDateLong(r.createdAt)}
              </p>
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
                {r.status !== 'approved' && (
                  <Button
                    size="sm"
                    onClick={() => setModerating({ review: r, status: 'approved' })}
                    disabled={moderateMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Approve
                  </Button>
                )}
                {r.status !== 'rejected' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setModerating({ review: r, status: 'rejected' })}
                    disabled={moderateMutation.isPending}
                  >
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    Reject
                  </Button>
                )}
                {r.status === 'approved' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setModerating({ review: r, status: 'pending' })}
                    disabled={moderateMutation.isPending}
                    title="Send back to pending"
                  >
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    Unpublish
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteTarget(r)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Moderation confirmation */}
      <Dialog open={!!moderating} onOpenChange={(o) => !o && setModerating(null)}>
        <DialogContent onClose={() => setModerating(null)}>
          {moderating && (
            <div className="p-6">
              <h2 className="text-lg font-semibold capitalize">
                {moderating.status === 'approved'
                  ? 'Approve review'
                  : moderating.status === 'rejected'
                    ? 'Reject review'
                    : 'Move review to pending'}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {moderating.status === 'approved'
                  ? 'Approved reviews become publicly visible with the rating summary.'
                  : moderating.status === 'rejected'
                    ? 'Rejected reviews are hidden from the public site.'
                    : 'The review will be hidden until approved again.'}
              </p>
              <blockquote className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <StarRating value={moderating.review.rating} />
                <p className="mt-1.5 font-medium">{moderating.review.title}</p>
              </blockquote>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setModerating(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    moderateMutation.mutate({
                      id: moderating.review.id,
                      status: moderating.status,
                    })
                  }
                  disabled={moderateMutation.isPending}
                >
                  {moderateMutation.isPending ? 'Saving…' : 'Confirm'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent onClose={() => setDeleteTarget(null)}>
          {deleteTarget && (
            <div className="p-6">
              <h2 className="text-lg font-semibold">Delete review</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Permanently delete <strong>{deleteTarget.title}</strong>? This cannot be
                undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                  Keep review
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(deleteTarget.id)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete review'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
