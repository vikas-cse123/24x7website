import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Globe, Ban, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { adminFaqApi } from '@/services/faqs'

const PAGE_SIZE = 12

function ConfirmDialog({ open, onOpenChange, title, body, onConfirm, pending }) {
  if (!open) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="destructive" onClick={onConfirm} disabled={pending}>
              {pending ? 'Working…' : 'Delete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function scopeLabel(faq) {
  if (faq.tripId) return 'Trip'
  if (faq.destinationId) return 'Destination'
  return 'Global'
}

export function AdminFaqsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = React.useState(1)
  const [scope, setScope] = React.useState('')
  const [published, setPublished] = React.useState('')
  const [search, setSearch] = React.useState('')
  const [searchInput, setSearchInput] = React.useState('')
  const [deleteTarget, setDeleteTarget] = React.useState(null)

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'faqs', { page, limit: PAGE_SIZE, scope: scope || undefined, published: published || undefined, search: search || undefined }],
    queryFn: () => adminFaqApi.list({ page, limit: PAGE_SIZE, ...(scope ? { scope } : {}), ...(published ? { published } : {}), ...(search ? { search } : {}) }),
    placeholderData: (prev) => prev,
  })
  const list = data?.data?.data

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] })

  const publishMutation = useMutation({
    mutationFn: ({ id, published: isPub }) => (isPub ? adminFaqApi.unpublish(id) : adminFaqApi.publish(id)),
    onSuccess: () => { toast.success('Updated'); invalidate() },
    onError: (err) => toast.error(err.message || 'Failed'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => adminFaqApi.remove(id),
    onSuccess: () => { toast.success('FAQ deleted'); setDeleteTarget(null); invalidate() },
    onError: (err) => toast.error(err.message || 'Delete failed'),
  })
  const reorderMutation = useMutation({
    mutationFn: ({ id, dir, currentOrder }) => {
      const newOrder = dir === 'up' ? currentOrder - 1 : currentOrder + 1
      return adminFaqApi.update(id, { displayOrder: Math.max(0, newOrder) })
    },
    onSuccess: () => { toast.success('Order updated'); invalidate() },
    onError: (err) => toast.error(err.message || 'Reorder failed'),
  })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FAQs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage global, destination and trip FAQs.</p>
        </div>
        <Link to="/admin/faqs/new">
          <Button><Plus className="h-4 w-4" aria-hidden="true" /> New FAQ</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Input placeholder="Search questions…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        <Select value={scope} onChange={(e) => { setScope(e.target.value); setPage(1) }} className="h-10 w-auto" aria-label="Filter by scope">
          <option value="">All scopes</option>
          <option value="global">Global</option>
          <option value="destination">Destination</option>
          <option value="trip">Trip</option>
        </Select>
        <Select value={published} onChange={(e) => { setPublished(e.target.value); setPage(1) }} className="h-10 w-auto" aria-label="Filter by published">
          <option value="">All</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />))}</div>
      ) : isError ? (
        <Card className="border-destructive/40 p-6 text-sm text-destructive">Could not load FAQs. {error?.message || 'Please try again.'}</Card>
      ) : list && list.items.length === 0 ? (
        <Card className="p-16 text-center">
          <p className="text-lg font-medium">No FAQs yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create the first FAQ.</p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {list.items.map((faq) => (
              <Card key={faq.id} className="p-4">
                <div className="flex flex-wrap items-start gap-4 sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{faq.question}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{faq.answer}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{scopeLabel(faq)}</Badge>
                      {faq.published ? <Badge variant="success">Published</Badge> : <Badge variant="outline">Draft</Badge>}
                      <span>Order: {faq.displayOrder}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <IconBtn label="Move up" onClick={() => reorderMutation.mutate({ id: faq.id, dir: 'up', currentOrder: faq.displayOrder })}>
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </IconBtn>
                    <IconBtn label="Move down" onClick={() => reorderMutation.mutate({ id: faq.id, dir: 'down', currentOrder: faq.displayOrder })}>
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </IconBtn>
                    <IconBtn label={faq.published ? 'Unpublish' : 'Publish'} onClick={() => publishMutation.mutate({ id: faq.id, published: faq.published })}>
                      {faq.published ? <Ban className="h-4 w-4" aria-hidden="true" /> : <Globe className="h-4 w-4" aria-hidden="true" />}
                    </IconBtn>
                    <Link to={`/admin/faqs/${faq.id}/edit`}>
                      <IconBtn label="Edit"><Pencil className="h-4 w-4" aria-hidden="true" /></IconBtn>
                    </Link>
                    <IconBtn label="Delete" danger onClick={() => setDeleteTarget(faq)}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </IconBtn>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {list.totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" disabled={list.page <= 1} onClick={() => setPage(list.page - 1)} aria-label="Previous page">‹</Button>
              <span className="text-sm text-muted-foreground">Page {list.page} of {list.totalPages}</span>
              <Button variant="outline" size="icon" disabled={list.page >= list.totalPages} onClick={() => setPage(list.page + 1)} aria-label="Next page">›</Button>
            </nav>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete FAQ"
        body={`Permanently delete "${deleteTarget?.question}"? This cannot be undone.`}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        pending={deleteMutation.isPending}
      />
    </div>
  )
}

function IconBtn({ label, onClick, danger, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${danger ? 'text-destructive hover:bg-destructive/10' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
    >
      {children}
    </button>
  )
}
