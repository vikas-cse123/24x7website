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
import { adminDestinationApi } from '@/services/destinations'

const PAGE_SIZE = 10

function DeleteDialog({ destination, open, onOpenChange, onConfirm, deleting }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">Delete destination</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{destination?.name}</strong>?
            This cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AdminDestinationsPage() {
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = React.useState(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'destinations', { page: 1, limit: PAGE_SIZE }],
    queryFn: () => adminDestinationApi.list({ page: 1, limit: PAGE_SIZE }),
  })

  const list = data?.data?.data

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] })

  const publishMutation = useMutation({
    mutationFn: adminDestinationApi.publish,
    onSuccess: () => {
      toast.success('Destination published')
      invalidate()
    },
    onError: (err) => toast.error(err.message || 'Publish failed'),
  })

  const unpublishMutation = useMutation({
    mutationFn: adminDestinationApi.unpublish,
    onSuccess: () => {
      toast.success('Destination unpublished')
      invalidate()
    },
    onError: (err) => toast.error(err.message || 'Unpublish failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminDestinationApi.remove,
    onSuccess: () => {
      toast.success('Destination deleted')
      setDeleteTarget(null)
      invalidate()
    },
    onError: (err) => toast.error(err.message || 'Delete failed'),
  })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Destinations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage destinations. Publish to make them visible on the public site.
          </p>
        </div>
        <Link to="/admin/destinations/new">
          <Button>
            <Plus className="h-4 w-4" />
            New destination
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
          Could not load destinations. {error?.message || 'Please try again.'}
        </Card>
      ) : list && list.items.length === 0 ? (
        <Card className="p-16 text-center">
          <p className="text-lg font-medium">No destinations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first destination to get started.
          </p>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Destination</th>
                  <th className="px-4 py-3 font-medium">Country</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Featured</th>
                  <th className="px-4 py-3 font-medium">Starting price</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <DestinationImage
                          src={d.heroImage?.url}
                          alt={d.name}
                          className="h-10 w-14 shrink-0 rounded-md"
                        />
                        <div>
                          <Link
                            to={`/admin/destinations/${d.id}/edit`}
                            className="font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                          >
                            {d.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">/{d.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.country}</td>
                    <td className="px-4 py-3">
                      {d.published ? (
                        <Badge variant="success">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {d.featured ? (
                        <Badge variant="warning">Featured</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {d.startingPrice !== null && d.startingPrice !== undefined
                        ? `₹${d.startingPrice.toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(d.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <AdminActions
                          destination={d}
                          onDelete={() => setDeleteTarget(d)}
                          onPublish={() => publishMutation.mutate(d.id)}
                          onUnpublish={() => unpublishMutation.mutate(d.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="space-y-3 md:hidden">
            {list.items.map((d) => (
              <Card key={d.id} className="p-4">
                <div className="flex items-center gap-3">
                  <DestinationImage
                    src={d.heroImage?.url}
                    alt={d.name}
                    className="h-12 w-16 shrink-0 rounded-md"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/admin/destinations/${d.id}/edit`}
                      className="font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      {d.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{d.country}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {d.published ? (
                        <Badge variant="success">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                      {d.featured && <Badge variant="warning">Featured</Badge>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-1">
                  <AdminActions
                    destination={d}
                    onDelete={() => setDeleteTarget(d)}
                    onPublish={() => publishMutation.mutate(d.id)}
                    onUnpublish={() => unpublishMutation.mutate(d.id)}
                  />
                </div>
              </Card>
            ))}
          </div>

          {list.totalPages > 1 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Showing {list.items.length} of {list.total} destinations
            </p>
          )}
        </>
      )}

      <DeleteDialog
        destination={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        deleting={deleteMutation.isPending}
      />
    </div>
  )
}

function AdminActions({ destination, onDelete, onPublish, onUnpublish }) {
  return (
    <div className="flex items-center gap-1">
      <a
        href={`/destination/${destination.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        title="View public page"
        aria-label="View public page"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
      <Link
        to={`/admin/destinations/${destination.id}/edit`}
        title="Edit"
        aria-label="Edit"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      {destination.published ? (
        <button
          type="button"
          onClick={onUnpublish}
          title="Unpublish"
          aria-label="Unpublish"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Ban className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onPublish}
          title="Publish"
          aria-label="Publish"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Globe className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        aria-label="Delete"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}