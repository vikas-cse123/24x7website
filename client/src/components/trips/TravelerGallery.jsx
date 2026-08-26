import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Images, Play } from 'lucide-react'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { resolveImageSrc } from '@/lib/cloudinary'
import { cn } from '@/lib/utils'
import httpClient from '@/services/http'

function useTravelerMedia(tripId, filter){
  return useQuery({
    queryKey: ['tripMedia', tripId, filter],
    queryFn: async () => {
      const params = {}
      if(filter && filter!=='all') params.mediaType = filter
      const { data } = await httpClient.get(`/trips/${tripId}/media`, { params })
      return data.data || []
    },
    enabled: !!tripId,
  })
}

export function TravelerGallery({ tripId, tripName }){
  const [tab, setTab] = React.useState('all')
  const { data: items = [], isLoading } = useTravelerMedia(tripId, tab==='all'?null:tab)
  const photos = items.filter(m=>m.mediaType==='photo')
  const videos = items.filter(m=>m.mediaType==='video')

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Gallery by Travelers</h2>
        <span className="text-xs text-muted-foreground">{items.length} {items.length===1?'item':'items'}</span>
      </div>
      <div className="mt-4 flex gap-2 border-b border-border">
        {[
          ['all', `All (${items.length})`],
          ['photo', `Photos (${photos.length})`],
          ['video', `Videos (${videos.length})`],
        ].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)}
            className={cn("border-b-2 px-3 py-2 text-sm font-medium transition-colors", tab===key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({length:4}).map((_,i)=><div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : items.length===0 ? (
        <div className="mt-6 rounded-xl border border-dashed bg-muted/30 p-10 text-center">
          <Images className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm font-medium">No traveler {tab==='video'?'videos':'photos'} yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Be the first to share your journey with {tripName}.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map(m=>(
            <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
              {m.mediaType==='video' ? (
                <div className="flex h-full w-full items-center justify-center bg-black">
                  <Play className="h-10 w-10 text-white/80" />
                  <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">Video</span>
                </div>
              ) : (
                <DestinationImage image={m} alt={m.altText || m.caption || tripName} className="h-full w-full" width={600} />
              )}
              {m.caption && <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-xs text-white line-clamp-1">{m.caption}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
