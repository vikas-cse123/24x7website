import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, MoreVertical, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { adminUsersApi } from '@/services/adminUsers'
import { formatPhone } from '@/lib/phone'

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    // 07 Sep 2026, 4:32 PM
    const day = String(d.getDate()).padStart(2, '0')
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const mon = months[d.getMonth()]
    const year = d.getFullYear()
    let hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return `${day} ${mon} ${year}, ${hours}:${minutes} ${ampm}`
  } catch {
    return String(iso).slice(0, 16)
  }
}

const ROLE_BADGE = {
  admin: 'bg-slate-900 text-white',
  staff: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  user: 'bg-slate-100 text-slate-700',
}

function ActionMenu({ user }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)
  const navigate = useNavigate()
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(v=>!v)} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Actions">
        <MoreVertical className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <button type="button" className="flex w-full px-3 py-1.5 text-xs hover:bg-slate-50" onClick={() => { setOpen(false); navigate(`/admin/users/${user.id}`) }}>View details</button>
          <a href={`mailto:${user.email}`} className="flex w-full px-3 py-1.5 text-xs hover:bg-slate-50" onClick={()=>setOpen(false)}>Email</a>
          <a href={`tel:${formatPhone(user.mobile, user.countryCode).replace(/[^\d+]/g,'')}`} className="flex w-full px-3 py-1.5 text-xs hover:bg-slate-50" onClick={()=>setOpen(false)}>Call</a>
        </div>
      )}
    </div>
  )
}

export function AdminUsersPage() {
  const [searchInput, setSearchInput] = React.useState('')
  const [search, setSearch] = React.useState('')
  const [role, setRole] = React.useState('all')
  const [role2, setRole2] = React.useState('all') // All Roles duplicate bound to same
  const [verification, setVerification] = React.useState('all')
  const [status, setStatus] = React.useState('all')
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(25)
  const [selected, setSelected] = React.useState(() => new Set())

  React.useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1) }, 320)
    return () => clearTimeout(t)
  }, [searchInput])

  // Keep both role selects in sync (All Users + All Roles are aliases per spec)
  const handleRoleChange = (v) => { setRole(v); setRole2(v); setPage(1) }
  const handleRole2Change = (v) => { setRole2(v); setRole(v); setPage(1) }

  const effectiveRole = role !== 'all' ? role : (role2 !== 'all' ? role2 : 'all')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin','users', { page, limit, search, role: effectiveRole, verification, status }],
    queryFn: () => adminUsersApi.list({ page, limit, ...(search?{search}:{}), ...(effectiveRole!=='all'?{role: effectiveRole}:{}), ...(verification!=='all'?{verification}:{}), ...(status!=='all'?{status}:{}) }),
    placeholderData: (prev)=>prev,
  })

  const result = data?.data?.data
  const items = result?.items || []
  const total = result?.total || 0
  const totalPages = result?.totalPages || 1
  const currentPage = result?.page || page

  const allSelected = items.length>0 && items.every(u=>selected.has(u.id))
  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(items.map(u=>u.id)))
  }
  const toggleOne = (id) => {
    setSelected(prev=>{
      const n=new Set(prev)
      if(n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  const start = total===0 ? 0 : (currentPage-1)*limit+1
  const end = Math.min(total, currentPage*limit)

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 overflow-hidden">
      <div className="flex min-w-0 max-w-full items-center gap-1.5 overflow-hidden text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Admin</span>
        <span className="text-slate-400">›</span>
        <span className="font-medium text-slate-700">Users</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-[22px]">Users</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-[13px]">Manage registered customers and admin users.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search users..." value={searchInput} onChange={e=>setSearchInput(e.target.value)} className="h-9 w-full min-w-0 max-w-full pl-8 text-xs focus-visible:ring-1 focus-visible:ring-slate-900 focus-visible:ring-offset-0" />
        </div>
        <Select value={role} onChange={e=>handleRoleChange(e.target.value)} className="h-9 w-[150px] shrink-0 text-xs" aria-label="All Users">
          <option value="all">All Users</option>
          <option value="user">Customers</option>
          <option value="admin">Admins</option>
          <option value="staff">Staff</option>
        </Select>
        <Select value={role2} onChange={e=>handleRole2Change(e.target.value)} className="h-9 w-[150px] shrink-0 text-xs" aria-label="All Roles">
          <option value="all">All Roles</option>
          <option value="user">Customer</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </Select>
        <Select value={verification} onChange={e=>{setVerification(e.target.value); setPage(1)}} className="h-9 w-[170px] shrink-0 text-xs" aria-label="Verification Status">
          <option value="all">Verification Status</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </Select>
        <Select value={status} onChange={e=>{setStatus(e.target.value); setPage(1)}} className="h-9 w-[150px] shrink-0 text-xs" aria-label="Active Status">
          <option value="all">Active Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-1">{Array.from({length:5}).map((_,i)=><div key={i} className="h-12 animate-pulse rounded-md bg-slate-100" />)}</div>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50 p-3 text-xs text-red-700">Could not load users. {error?.message || 'Please try again.'}</Card>
      ) : total===0 ? (
        <Card className="flex min-h-[180px] flex-col items-center justify-center border-slate-200 bg-white px-6 py-8 text-center">
          <p className="text-[14px] font-semibold text-slate-900">{search || effectiveRole!=='all' || verification!=='all' || status!=='all' ? 'No matching users' : 'No users yet'}</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">{search ? `No results for "${search}"` : 'Registered customers will appear here once they create an account.'}</p>
        </Card>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="max-h-[65vh] min-h-[360px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="w-8 px-2 py-2"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-3.5 w-3.5 rounded border-slate-300" /></th>
                    <th className="px-2 py-2 min-w-[160px]">Name</th>
                    <th className="px-2 py-2 min-w-[180px]">Email</th>
                    <th className="px-2 py-2 min-w-[140px]">Phone</th>
                    <th className="px-2 py-2">Role</th>
                    <th className="px-2 py-2">Email Status</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2 min-w-[140px]">Created</th>
                    <th className="px-2 py-2 min-w-[140px]">Last Updated</th>
                    <th className="px-2 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(u=> (
                    <tr key={u.id} className={`h-12 hover:bg-slate-50 ${selected.has(u.id) ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-2 py-2"><input type="checkbox" checked={selected.has(u.id)} onChange={()=>toggleOne(u.id)} className="h-3.5 w-3.5 rounded border-slate-300" /></td>
                      <td className="px-2 py-2">
                        <Link to={`/admin/users/${u.id}`} className="block min-w-0 max-w-full">
                          <p className="truncate text-sm font-medium text-slate-900 hover:underline">{u.name || '—'}</p>
                          <p className="truncate text-xs text-slate-500">{u.email || ''}</p>
                        </Link>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-sm text-slate-700">{u.email || '—'}</span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="whitespace-nowrap text-sm text-slate-700">{u.mobile ? formatPhone(u.mobile, u.countryCode) : '—'}</span>
                      </td>
                      <td className="px-2 py-2">
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium capitalize ${ROLE_BADGE[u.role] || ROLE_BADGE.user}`}>{u.role === 'user' ? 'Customer' : u.role}</span>
                      </td>
                      <td className="px-2 py-2">
                        {u.emailVerified ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"><CheckCircle2 className="h-3 w-3" /> Verified</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200"><XCircle className="h-3 w-3" /> Unverified</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active</span>
                        ) : (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">Inactive</span>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-slate-600">{formatDateTime(u.createdAt)}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-slate-600">{formatDateTime(u.updatedAt)}</td>
                      <td className="px-2 py-2 text-right"><ActionMenu user={u} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-slate-600">
              <span>Showing {start}–{end} of {total} users</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Rows per page:</span>
                <Select value={String(limit)} onChange={e=>{setLimit(parseInt(e.target.value,10)); setPage(1)}} className="h-7 w-[80px] text-xs">
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</Button>
              {Array.from({length: Math.min(totalPages, 7)}).map((_, i)=>{
                // Show window around current page
                let p
                if (totalPages <=7) p=i+1
                else if (currentPage <=4) p=i+1
                else if (currentPage >= totalPages-3) p= totalPages-6+i
                else p= currentPage-3+i
                const isActive = p===currentPage
                return <button key={p} onClick={()=>setPage(p)} className={`grid h-7 min-w-7 place-items-center rounded px-2 text-xs ${isActive ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white hover:bg-slate-50'}`}>{p}</button>
              })}
              {totalPages>7 && currentPage < totalPages-3 && <span className="px-1 text-slate-400">…</span>}
              {totalPages>7 && <button onClick={()=>setPage(totalPages)} className={`grid h-7 min-w-7 place-items-center rounded border px-2 text-xs ${currentPage===totalPages?'bg-slate-900 text-white':'bg-white hover:bg-slate-50'}`}>{totalPages}</button>}
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
