import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Mail, Phone, Shield, User, Clock, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { adminUsersApi } from '@/services/adminUsers'
import { formatPhone } from '@/lib/phone'

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    const day = String(d.getDate()).padStart(2,'0')
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}, ${d.getHours()%12||12}:${String(d.getMinutes()).padStart(2,'0')} ${d.getHours()>=12?'PM':'AM'}`
  } catch { return String(iso) }
}

function TabButton({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`relative whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors ${active ? 'border-emerald-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
      {children}
    </button>
  )
}

export function AdminUserDetailPage() {
  const { id } = useParams()
  const [tab, setTab] = React.useState('overview')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin','users', id],
    queryFn: () => adminUsersApi.getById(id),
  })
  const user = data?.data?.data

  const wishlistQuery = useQuery({
    queryKey: ['admin','users', id, 'wishlist'],
    queryFn: () => adminUsersApi.wishlist(id),
    enabled: !!id && tab==='wishlist',
  })
  const wishlistItems = wishlistQuery.data?.data?.data?.items || []

  if (isLoading) return <div className="space-y-3"><div className="h-20 animate-pulse rounded bg-slate-100" /><div className="h-64 animate-pulse rounded bg-slate-100" /></div>
  if (isError || !user) return <div className="py-16 text-center"><p className="font-medium">User not found</p><p className="text-xs text-red-600">{error?.message}</p><Link to="/admin/users" className="mt-4 inline-flex items-center gap-1 text-sm text-primary"><ArrowLeft className="h-4 w-4" /> Back to users</Link></div>

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/admin/users" className="hover:text-slate-700">Users</Link>
        <span>›</span>
        <span className="font-medium text-slate-900">{user.name || user.email || 'User'}</span>
      </div>

      <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"><ArrowLeft className="h-3.5 w-3.5" /> Back to users</Link>

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">User</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-[22px]">{user.name || '—'}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" />{user.email || '—'}</span>
              <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" />{user.mobile ? formatPhone(user.mobile, user.countryCode) : '—'}</span>
              <Badge variant={user.role==='admin' ? 'default' : 'secondary'} className="capitalize text-xs">{user.role==='user' ? 'User' : user.role}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.emailVerified ? <Badge variant="success" className="text-xs">✓ Verified</Badge> : <Badge variant="warning" className="text-xs">Unverified</Badge>}
            {user.isActive ? <Badge variant="success" className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
          </div>
        </div>

        <div className="mt-5 flex gap-1 border-b border-slate-200">
          <TabButton active={tab==='overview'} onClick={()=>setTab('overview')}>Overview</TabButton>
          <TabButton active={tab==='wishlist'} onClick={()=>setTab('wishlist')}>Wishlist {wishlistItems.length ? `(${wishlistItems.length})` : ''}</TabButton>
          <TabButton active={tab==='activity'} onClick={()=>setTab('activity')}>Activity</TabButton>
        </div>

        <div className="mt-4">
          {tab==='overview' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-slate-200">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Contact & identity</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium">{user.name || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium">{user.email || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="font-medium">{user.mobile ? formatPhone(user.mobile, user.countryCode) : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Country code</span><span className="font-mono">{user.countryCode}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Role</span><span className="capitalize font-medium">{user.role}</span></div>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Verification & status</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Email verified</span><span className={`font-medium ${user.emailVerified ? 'text-emerald-600' : 'text-amber-600'}`}>{user.emailVerified ? 'Verified' : 'Unverified'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Mobile verified</span><span className={`font-medium ${user.mobileVerified ? 'text-emerald-600' : 'text-amber-600'}`}>{user.mobileVerified ? 'Verified' : 'Unverified'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Active</span><span className="font-medium">{user.isActive ? 'Active' : 'Inactive'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Last login</span><span className="font-medium">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—'}</span></div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 sm:col-span-2">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Record information</CardTitle></CardHeader>
                <CardContent className="grid gap-2 text-xs sm:grid-cols-2">
                  <div className="flex justify-between"><span className="text-slate-500">Created</span><span className="font-medium">{formatDateTime(user.createdAt)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Last updated</span><span className="font-medium">{formatDateTime(user.updatedAt)}</span></div>
                  <div className="flex justify-between sm:col-span-2"><span className="text-slate-500">User ID</span><span className="font-mono text-xs">{user.id}</span></div>
                </CardContent>
              </Card>
            </div>
          )}

          {tab==='wishlist' && (
            <div>
              {wishlistQuery.isLoading ? (
                <div className="space-y-2">{Array.from({length:3}).map((_,i)=><div key={i} className="h-14 animate-pulse rounded bg-slate-100" />)}</div>
              ) : wishlistQuery.isError ? (
                <Card className="border-red-200 bg-red-50 p-3 text-xs text-red-700">Could not load wishlist. {wishlistQuery.error?.message}</Card>
              ) : wishlistItems.length===0 ? (
                <Card className="flex min-h-[140px] flex-col items-center justify-center border-dashed p-8 text-center">
                  <p className="mt-2 text-sm font-medium">No wishlist items</p>
                  <p className="text-xs text-slate-500">When this user saves a trip, it will appear here with date added.</p>
                </Card>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <div className="max-h-[60vh] overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-slate-50">
                        <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="px-3 py-2">Trip</th>
                          <th className="px-3 py-2">Destination</th>
                          <th className="px-3 py-2">Added On</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {wishlistItems.map(w=>{
                          const isTrip = w.itemType==='trip'
                          const tripAvailable = !w.unavailable && w.item
                          return (
                            <tr key={w.id} className="h-12 hover:bg-slate-50">
                              <td className="px-3 py-2">
                                {isTrip ? (
                                  tripAvailable ? (
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium text-slate-900">{w.item.name}</p>
                                      <p className="truncate font-mono text-xs text-slate-500">/{w.item.slug}</p>
                                    </div>
                                  ) : <span className="text-slate-400">Unavailable trip</span>
                                ) : (
                                  tripAvailable ? <span className="font-medium">{w.item.name}</span> : <span className="text-slate-400">Unavailable</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-slate-600">{isTrip ? (tripAvailable ? w.item.destination?.name || '—' : '—') : (tripAvailable ? w.item.country || '—' : '—')}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-slate-600">{formatDateTime(w.createdAt)}</td>
                              <td className="px-3 py-2">
                                {tripAvailable && w.item.published !== false ? (
                                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">Active</span>
                                ) : tripAvailable ? (
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">Draft</span>
                                ) : (
                                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600">Unavailable</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {isTrip && tripAvailable ? (
                                  <a href={`/trip/${w.item.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-50"><ExternalLink className="h-3 w-3" /> View Trip</a>
                                ) : !isTrip && tripAvailable ? (
                                  <a href={`/destination/${w.item.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-50"><ExternalLink className="h-3 w-3" /> View</a>
                                ) : <span className="text-xs text-slate-400">—</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab==='activity' && (
            <Card className="border-slate-200">
              <CardContent className="p-6 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-slate-400" /> Created: <span className="font-medium">{formatDateTime(user.createdAt)}</span></div>
                  <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-slate-400" /> Last updated: <span className="font-medium">{formatDateTime(user.updatedAt)}</span></div>
                  <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-400" /> Last login: <span className="font-medium">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}</span></div>
                  <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-slate-400" /> Role: <span className="font-medium capitalize">{user.role}</span></div>
                </div>
                <p className="mt-4 text-xs text-slate-500">Full activity timeline (logins, wishlist changes) can be expanded here as more audit events are added.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
