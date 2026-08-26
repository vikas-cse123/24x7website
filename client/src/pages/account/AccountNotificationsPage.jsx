import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCheck, Trash2, BellOff, ChevronLeft, ChevronRight } from 'lucide-react'
import { notificationApi } from '@/services/account'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function hrefFor(n){
  if(n.relatedEntityType==='booking') return '/account/bookings'
  if(n.relatedEntityType==='trip' || n.relatedEntityType==='trip_batch') return '/account/bookings'
  if(n.relatedEntityType==='review') return '/account/reviews'
  return '#'
}

export function AccountNotificationsPage(){
  const qc=useQueryClient()
  const [page,setPage]=React.useState(1)
  const PAGE=10
  const invalidate=()=>qc.invalidateQueries({queryKey:['notifications']})

  const { data, isLoading, isError } = useQuery({
    queryKey:['notifications',{page}],
    queryFn:()=>notificationApi.list({ page, limit:PAGE }),
  })
  const result=data?.data?.data
  const items=result?.items||[]

  const markRead=useMutation({ mutationFn:(id)=>notificationApi.markRead(id), onSuccess:invalidate })
  const markAll=useMutation({ mutationFn:()=>notificationApi.markAllRead(), onSuccess:invalidate })
  const del=useMutation({ mutationFn:(id)=>notificationApi.remove(id), onSuccess:invalidate })

  if(isLoading) return <div className="space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-16 animate-pulse rounded-xl bg-muted"/> )}</div>
  if(isError) return <Card className="p-6 text-sm text-destructive">Could not load notifications</Card>

  if(items.length===0){
    return (
      <Card className="p-12 text-center">
        <BellOff className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 font-medium">No notifications</p>
        <p className="text-sm text-muted-foreground">Updates about your bookings, departures and reviews will appear here.</p>
        <Link to="/trips" className="mt-4 inline-block"><Button>Explore trips</Button></Link>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{result?.total || items.length} notifications</p>
        <Button variant="outline" size="sm" onClick={()=>markAll.mutate()}><CheckCheck className="h-4 w-4" />Mark all read</Button>
      </div>

      {items.map(n=>{
        const unread=!n.readAt
        return (
          <Card key={n.id} className={cn("p-4", unread && "border-primary/40 bg-primary/[0.03]")}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", unread ? "bg-primary" : "bg-transparent")} aria-hidden="true" />
                  <p className={cn("text-sm", unread ? "font-semibold" : "font-medium")}>{n.title}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {unread && <Button size="sm" variant="ghost" onClick={()=>markRead.mutate(n.id)}><CheckCheck className="h-4 w-4" />Read</Button>}
                <Button size="icon" variant="ghost" aria-label="Delete notification" onClick={()=>del.mutate(n.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        )
      })}

      {result?.totalPages>1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" disabled={page<=1} onClick={()=>setPage(page-1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground">Page {result.page} of {result.totalPages}</span>
          <Button variant="outline" size="icon" disabled={page>=result.totalPages} onClick={()=>setPage(page+1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
        </nav>
      )}
    </div>
  )
}
