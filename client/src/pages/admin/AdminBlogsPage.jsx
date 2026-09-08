import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Globe, Ban, Search, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { adminBlogApi } from '@/services/blogs'
import { BLOG_CATEGORIES, BLOG_CATEGORY_LABELS } from '@/schemas/blog'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

const PAGE_SIZE = 12

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    const day = String(d.getDate()).padStart(2,'0')
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const mon = months[d.getMonth()]
    const year = d.getFullYear()
    let h = d.getHours()
    const m = String(d.getMinutes()).padStart(2,'0')
    const ampm = h>=12 ? 'PM' : 'AM'
    h = h%12 || 12
    return `${day} ${mon} ${year}, ${h}:${m} ${ampm}`
  } catch { return String(iso).slice(0,16) }
}

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

function RowMenu({ blog, onPublish, onDelete }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)
  React.useEffect(()=>{ const h=e=>{ if(ref.current && !ref.current.contains(e.target)) setOpen(false)}; document.addEventListener('mousedown',h); return ()=>document.removeEventListener('mousedown',h)},[])
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={()=>setOpen(v=>!v)} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Actions">
        <MoreVertical className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg text-xs">
          <button type="button" className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-slate-50" onClick={()=>{ setOpen(false); onPublish()}}>{blog.published ? 'Unpublish' : 'Publish'}</button>
          <Link to={`/admin/blogs/${blog.id}/edit`} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50" onClick={()=>setOpen(false)}>Edit</Link>
          <div className="my-1 border-t border-slate-100" />
          <button type="button" className="flex w-full items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50" onClick={()=>{ setOpen(false); onDelete()}}>Delete</button>
        </div>
      )}
    </div>
  )
}

export function AdminBlogsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState('')
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [categoryFilter, setCategoryFilter] = React.useState('all')
  const [selected, setSelected] = React.useState(()=> new Set())
  const [deleteTarget, setDeleteTarget] = React.useState(null)
  const [featureTarget, setFeatureTarget] = React.useState(null)

  React.useEffect(()=>{ const t=setTimeout(()=>{ setSearch(searchInput.trim()); setPage(1)}, 300); return ()=>clearTimeout(t)},[searchInput])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin','blogs', { page, limit: PAGE_SIZE, search: search||undefined, status: statusFilter, category: categoryFilter }],
    queryFn: () => adminBlogApi.list({
      page,
      limit: PAGE_SIZE,
      ...(search ? { search } : {}),
      ...(statusFilter==='published' ? { published: 'true' } : statusFilter==='draft' ? { published: 'false' } : {}),
      ...(categoryFilter!=='all' ? { category: categoryFilter } : {}),
    }),
    placeholderData: (prev)=>prev,
  })
  const list = data?.data?.data
  const items = list?.items || []

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin','blogs'] })
    queryClient.invalidateQueries({ queryKey: ['blogs'] })
    queryClient.invalidateQueries({ queryKey: ['home'] })
  }

  const publishMutation = useMutation({
    mutationFn: ({ id, published }) => published ? adminBlogApi.unpublish(id) : adminBlogApi.publish(id),
    onSuccess: (res)=>{ toast.success(res?.data?.message || 'Updated'); invalidate() },
    onError: (err)=> toast.error(err.message || 'Failed'),
  })
  const featureMutation = useMutation({
    mutationFn: async ({ id }) => {
      const current = await adminBlogApi.getById(id).then(r=>r.data.data)
      return adminBlogApi.update(id, { ...pickUpdatable(current), featured: !current.featured })
    },
    onSuccess: (res)=>{ toast.success(res?.data?.featured ? 'Marked as featured' : 'Removed from featured'); setFeatureTarget(null); invalidate() },
    onError: (err)=> toast.error(err.message || 'Failed'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id)=> adminBlogApi.remove(id),
    onSuccess: ()=>{ toast.success('Blog deleted'); setDeleteTarget(null); invalidate() },
    onError: (err)=> toast.error(err.message || 'Delete failed'),
  })

  function pickUpdatable(b){ if(!b) return {}; return { title:b.title, excerpt:b.excerpt, content:b.content, coverImage:b.coverImage||{}, category:b.category, tags:b.tags||[], destinationId:b.destinationId||null, seoTitle:b.seoTitle||'', seoDescription:b.seoDescription||'' } }

  const allSelected = items.length>0 && items.every(b=>selected.has(b.id))
  const toggleAll = ()=> {
    if(allSelected) setSelected(new Set())
    else setSelected(new Set(items.map(b=>b.id)))
  }
  const toggleOne = (id)=> setSelected(prev=>{ const n=new Set(prev); if(n.has(id)) n.delete(id); else n.add(id); return n })

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 overflow-hidden">
      <div className="flex min-w-0 max-w-full items-center gap-1.5 overflow-hidden text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Admin</span>
        <span className="text-slate-400">›</span>
        <span className="font-medium text-slate-700">Blogs</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-4 sm:px-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-[22px]">Blogs</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-[13px]">Write, publish and feature travel stories.</p>
        </div>
        <Link to="/admin/blogs/new">
          <Button size="sm" className="h-9 min-w-[110px] rounded-md bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" /> New Blog
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search blogs..." value={searchInput} onChange={e=>setSearchInput(e.target.value)} className="h-9 pl-8 text-xs focus-visible:ring-1 focus-visible:ring-slate-900" />
        </div>
        <Select value={statusFilter} onChange={e=>{ setStatusFilter(e.target.value); setPage(1)}} className="h-9 w-[150px] shrink-0 text-xs">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </Select>
        <Select value={categoryFilter} onChange={e=>{ setCategoryFilter(e.target.value); setPage(1)}} className="h-9 w-[170px] shrink-0 text-xs">
          <option value="all">All Categories</option>
          {BLOG_CATEGORIES.map(c=> <option key={c} value={c}>{BLOG_CATEGORY_LABELS[c]}</option>)}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-1">{Array.from({length:5}).map((_,i)=><div key={i} className="h-12 animate-pulse rounded-md bg-slate-100" />)}</div>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50 p-3 text-xs text-red-700">Could not load blogs. {error?.message || 'Please try again.'}</Card>
      ) : !list || items.length===0 ? (
        <Card className="flex min-h-[180px] flex-col items-center justify-center border-slate-200 bg-white px-6 py-8 text-center">
          <p className="text-[14px] font-semibold text-slate-900">{search || statusFilter!=='all' || categoryFilter!=='all' ? `No results for "${search || statusFilter}"` : 'No blogs yet'}</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">Write your first travel story.</p>
          {!search && statusFilter==='all' && categoryFilter==='all' && (
            <Link to="/admin/blogs/new" className="mt-4 inline-flex"><Button size="sm" className="h-8 bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"><Plus className="h-3.5 w-3.5" /> Create Blog</Button></Link>
          )}
        </Card>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="max-h-[65vh] min-h-[360px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-2 min-w-[240px]">Title</th>
                    <th className="px-2 py-2">Category</th>
                    <th className="px-2 py-2">Destination</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2 min-w-[140px]">Updated</th>
                    <th className="px-2 py-2">Author</th>
                    <th className="px-2 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(b=>(
                    <tr key={b.id} className="h-[52px] hover:bg-slate-50">
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <DestinationImage src={b.coverImage?.url || b.coverImage?.secureUrl} alt={b.title} className="h-9 w-14 shrink-0 rounded border border-slate-200 object-cover" />
                          <div className="min-w-0">
                            <Link to={`/admin/blogs/${b.id}/edit`} className="block truncate text-sm font-medium text-slate-900 hover:underline max-w-[220px]">{b.title}</Link>
                            <p className="truncate font-mono text-xs text-slate-500 max-w-[220px]">/{b.slug} · {b.readingTime} min{b.featured ? ' · ★' : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2"><span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium capitalize text-slate-600">{BLOG_CATEGORY_LABELS[b.category] || b.category}</span></td>
                      <td className="px-2 py-2 text-slate-600">{b.destination?.name || '—'}</td>
                      <td className="px-2 py-2">
                        {b.published ? <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Published</span> : <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">Draft</span>}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-slate-600">{formatDateTime(b.updatedAt)}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-slate-700">{b.author || '—'}</td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={()=> publishMutation.mutate({ id:b.id, published:b.published })} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100" title={b.published ? 'Unpublish' : 'Publish'}>
                            {b.published ? <Ban className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                          </button>
                          <RowMenu blog={b} onPublish={()=> publishMutation.mutate({ id:b.id, published:b.published })} onDelete={()=> setDeleteTarget(b)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>Showing {items.length} of {list.total} {list.totalPages>1 ? `• Page ${list.page}/${list.totalPages}` : ''}</span>
            {list.totalPages>1 && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={list.page<=1} onClick={()=> setPage(p=> Math.max(1,p-1))}>Previous</Button>
                <span className="px-2 text-xs">{list.page} / {list.totalPages}</span>
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={list.page>=list.totalPages} onClick={()=> setPage(p=> Math.min(list.totalPages,p+1))}>Next</Button>
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o)=> !o && setDeleteTarget(null)}
        title="Delete blog"
        body={`Permanently delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete blog"
        onConfirm={()=> deleteMutation.mutate(deleteTarget.id)}
        pending={deleteMutation.isPending}
      />
      <ConfirmDialog
        open={!!featureTarget}
        onOpenChange={(o)=> !o && setFeatureTarget(null)}
        title={featureTarget?.featured ? 'Remove from featured' : 'Mark as featured'}
        body={ featureTarget?.featured ? `"${featureTarget?.title}" will no longer be highlighted as featured.` : `"${featureTarget?.title}" will be highlighted as a featured story.` }
        confirmLabel={featureTarget?.featured ? 'Remove' : 'Feature'}
        danger={false}
        onConfirm={()=> featureMutation.mutate({ id: featureTarget.id })}
        pending={featureMutation.isPending}
      />
    </div>
  )
}
