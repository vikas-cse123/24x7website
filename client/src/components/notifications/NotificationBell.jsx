import * as React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/services/account'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

function hrefFor(n){
  if(n.relatedEntityType==='booking') return '/account/bookings'
  if(n.relatedEntityType==='trip' || n.relatedEntityType==='trip_batch') return '/account/bookings'
  if(n.relatedEntityType==='review') return '/account/reviews'
  return '/account/notifications'
}

function NotificationItem({ n }){
  const qc=useQueryClient()
  const readMut=useMutation({ mutationFn:()=>notificationApi.markRead(n.id), onSuccess:()=>qc.invalidateQueries({queryKey:['notifications']}) })
  const delMut=useMutation({ mutationFn:()=>notificationApi.remove(n.id), onSuccess:()=>qc.invalidateQueries({queryKey:['notifications']}) })
  const unread = !n.readAt
  return (
    <div className={cn("flex items-start gap-2 border-b border-border px-3 py-2.5 last:border-0", unread && "bg-primary/5")}>
      <button type="button" onClick={()=>{ if(unread) readMut.mutate() }}
        className="flex min-w-0 flex-1 flex-col text-left focus-visible:outline-none">
        <span className={cn("text-sm", unread ? "font-semibold text-foreground" : "text-foreground/70")}>{n.title}</span>
        <span className="line-clamp-2 text-xs text-muted-foreground">{n.message}</span>
        <span className="mt-0.5 text-[11px] text-muted-foreground/70">
          {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : ''}
        </span>
      </button>
      <button type="button" aria-label="Delete notification" onClick={()=>delMut.mutate()} className="mt-0.5 shrink-0 rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
  )
}

export function NotificationBell(){
  const { isAuthenticated } = useAuth()
  const [open, setOpen]=React.useState(false)
  const ref=React.useRef(null)
  const qc=useQueryClient()
  const navigate=useNavigate()

  const { data: listData } = useQuery({
    queryKey:['notifications','recent'],
    queryFn:()=>notificationApi.list({ limit:5 }),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  })
  const { data: countData } = useQuery({
    queryKey:['notifications','count'],
    queryFn:()=>notificationApi.unreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  })

  const items=listData?.data?.data?.items||[]
  const unreadCount=countData?.data?.data?.unreadCount ?? listData?.data?.data?.unreadCount ?? 0

  React.useEffect(()=>{
    if(!open) return undefined
    const onPointer=(e)=>{ if(ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey=(e)=>{ if(e.key==='Escape') setOpen(false) }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return ()=>{ document.removeEventListener('mousedown',onPointer); document.removeEventListener('keydown',onKey) }
  },[open])

  if(!isAuthenticated) return null

  const markAll=async()=>{ await notificationApi.markAllRead(); qc.invalidateQueries({queryKey:['notifications']}) }

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={unreadCount?`Notifications (${unreadCount} unread)`:'Notifications'} aria-expanded={open}
        onClick={()=>setOpen(v=>!v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Bell className="h-4 w-4" />
        {unreadCount>0 && <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unreadCount>9?'9+':unreadCount}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-card">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            <button type="button" onClick={markAll} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><CheckCheck className="h-3.5 w-3.5" />Mark all read</button>
          </div>
          {items.length===0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No notifications</p>
          ) : (
            <>
              {items.map(n=>(
                <div key={n.id} onClick={()=>{ setOpen(false); if(!n.readAt) notificationApi.markRead(n.id).then(()=>qc.invalidateQueries({queryKey:['notifications']})).catch(()=>{}); navigate(hrefFor(n)) }}>
                  <NotificationItem n={n} />
                </div>
              ))}
              <Link to="/account/notifications" onClick={()=>setOpen(false)} className="block border-t border-border px-3 py-2 text-center text-sm font-medium text-primary hover:bg-accent">View all</Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
