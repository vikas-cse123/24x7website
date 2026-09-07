import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MessageSquare, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { adminEnquiryApi } from '@/services/enquiries'
import { formatDateLong } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { formatPhone } from '@/lib/phone'

const PAGE_SIZE = 12

const STATUS_BADGE = {
  new: 'warning',
  'in-progress': 'secondary',
  resolved: 'success',
}

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
              {pending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AdminEnquiriesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = React.useState(1)
  const [status, setStatus] = React.useState('')
  const [source, setSource] = React.useState('')
  const [search, setSearch] = React.useState('')
  const [searchInput, setSearchInput] = React.useState('')
  const [deleteTarget, setDeleteTarget] = React.useState(null)

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'enquiries', { page, limit: PAGE_SIZE, status: status || undefined, source: source || undefined, search: search || undefined }],
    queryFn: () =>
      adminEnquiryApi.list({
        page,
        limit: PAGE_SIZE,
        ...(status ? { status } : {}),
        ...(source ? { source } : {}),
        ...(search ? { search } : {}),
      }),
    placeholderData: (prev) => prev,
  })
  const list = data?.data?.data

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'enquiries'] })

  const statusMutation = useMutation({
    mutationFn: ({ id, status: st }) => adminEnquiryApi.setStatus(id, st),
    onSuccess: () => { toast.success('Enquiry updated'); invalidate() },
    onError: (err) => toast.error(err.message || 'Update failed'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => adminEnquiryApi.remove(id),
    onSuccess: () => { toast.success('Enquiry deleted'); setDeleteTarget(null); invalidate() },
    onError: (err) => toast.error(err.message || 'Delete failed'),
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Enquiries</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Custom-trip and website lead requests from visitors.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Input placeholder="Search name, email, phone…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="h-10 w-auto" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="in-progress">In progress</option>
          <option value="resolved">Resolved</option>
        </Select>
        <Select value={source} onChange={(e) => { setSource(e.target.value); setPage(1) }} className="h-10 w-auto" aria-label="Filter by source">
          <option value="">All sources</option>
          <option value="custom_trip">Custom trip</option>
          <option value="website">Website</option>
          <option value="contact_form">Contact form</option>
          <option value="trip_page">Trip page</option>
          <option value="destination_page">Destination page</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />))}</div>
      ) : isError ? (
        <Card className="border-destructive/40 p-6 text-sm text-destructive">Could not load enquiries. {error?.message || 'Please try again.'}</Card>
      ) : list && list.items.length === 0 ? (
        <Card className="p-16 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/30" aria-hidden="true" />
          <p className="mt-3 text-lg font-medium">No enquiries yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Custom-trip leads submitted through the website will appear here.
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {list.items.map((e) => (
              <Card key={e.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold leading-snug">{e.name}</p>
                      <Badge variant={STATUS_BADGE[e.status] || 'secondary'}>
                        {e.status.replace('-', ' ')}
                      </Badge>
                      {e.source === 'custom_trip' && <Badge variant="outline">Custom trip</Badge>}
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {e.destinationName && (
                        <span>
                          Destination: <span className="font-medium text-foreground">{e.destinationName}</span>
                        </span>
                      )}
                      <span>{formatPhone(e.phone, e.countryCode)}</span>
                      <span>{e.email}</span>
                      <span>· {formatDateLong(e.createdAt)}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Select
                      value={e.status}
                      onChange={(ev) => statusMutation.mutate({ id: e.id, status: ev.target.value })}
                      className="h-9 w-auto"
                      aria-label={`Status for ${e.name}`}
                    >
                      <option value="new">New</option>
                      <option value="in-progress">In progress</option>
                      <option value="resolved">Resolved</option>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete enquiry from ${e.name}`}
                      onClick={() => setDeleteTarget(e)}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {list.totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" disabled={list.page <= 1} onClick={() => setPage(list.page - 1)} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {list.page} of {list.totalPages}
              </span>
              <Button variant="outline" size="icon" disabled={list.page >= list.totalPages} onClick={() => setPage(list.page + 1)} aria-label="Next page">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </nav>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete enquiry"
        body={`Permanently delete the enquiry from "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        pending={deleteMutation.isPending}
      />
    </div>
  )
}