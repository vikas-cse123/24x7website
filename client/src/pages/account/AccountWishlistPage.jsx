import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { wishlistApi } from '@/services/account'
import { DestinationImage } from '@/components/destinations/DestinationImage'

export function AccountWishlistPage(){
  const qc=useQueryClient()
  const {data,isLoading,isError} = useQuery({queryKey:['wishlist'], queryFn:()=>wishlistApi.list().then(r=>r.data.data)})
  const items=data?.items||[]
  const trips=items.filter(i=>i.itemType==='trip')
  const dests=items.filter(i=>i.itemType==='destination')
  const del=useMutation({mutationFn:({type,id})=>wishlistApi.remove(type,id), onSuccess:()=>qc.invalidateQueries({queryKey:['wishlist']})})
  
  if(isLoading) return <div className="grid gap-4 sm:grid-cols-2">{[1,2,3,4].map(i=><div key={i} className="h-48 animate-pulse rounded-xl bg-muted"/> )}</div>
  if(isError) return <Card className="p-6 text-sm text-destructive">Could not load wishlist</Card>
  if(!items.length) return (
    <Card className="p-12 text-center">
      <p className="mt-3 font-medium">Your wishlist is empty</p>
      <p className="text-sm text-muted-foreground">No saved trips or destinations yet.</p>
      <div className="mt-4 flex justify-center gap-3"><Link to="/trips"><Button>Explore Trips</Button></Link><Link to="/destinations"><Button variant="outline">Destinations</Button></Link></div>
    </Card>
  )
  return (
    <div className="space-y-8">
      {trips.length>0 && (
        <section>
          <h3 className="font-semibold">Saved Trips · {trips.length}</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {trips.map(w=>(
              <Card key={w.id} className="overflow-hidden">
                {w.item ? (
                  <Link to={`/trip/${w.item.slug}`} className="block">
                    <DestinationImage src={w.item.heroImage?.url} alt={w.item.name} className="aspect-[16/10] w-full" />
                    <div className="p-4">
                      <h4 className="font-medium line-clamp-1">{w.item.name}</h4>
                      <p className="text-xs text-muted-foreground">{w.item.destination?.name} · {w.item.durationDays}D/{w.item.durationNights}N</p>
                    </div>
                  </Link>
                ) : <div className="p-4 text-sm text-muted-foreground">Trip no longer available</div>}
                <div className="px-4 pb-3"><Button variant="ghost" size="sm" onClick={()=>del.mutate({type:'trip',id:w.itemId})}><Trash2 className="h-4 w-4"/> Remove</Button></div>
              </Card>
            ))}
          </div>
        </section>
      )}
      {dests.length>0 && (
        <section>
          <h3 className="font-semibold">Saved Destinations · {dests.length}</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {dests.map(w=>(
              <Card key={w.id} className="overflow-hidden">
                {w.item ? (
                  <Link to={`/destination/${w.item.slug}`} className="block">
                    <DestinationImage src={w.item.heroImage?.url} alt={w.item.name} className="aspect-[16/10] w-full" />
                    <div className="p-4"><h4 className="font-medium">{w.item.name}</h4><p className="text-xs text-muted-foreground">{w.item.country}</p></div>
                  </Link>
                ) : <div className="p-4 text-sm text-muted-foreground">Destination no longer available</div>}
                <div className="px-4 pb-3"><Button variant="ghost" size="sm" onClick={()=>del.mutate({type:'destination',id:w.itemId})}><Trash2 className="h-4 w-4"/> Remove</Button></div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
