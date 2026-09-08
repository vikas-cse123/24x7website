import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { resolveImageSrc } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Lightbox } from '@/components/ui/lightbox'
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

const TABS = [
  { key: 'all', label: 'All', icon: '🖼️' },
  { key: 'photo', label: 'Photos', icon: '📷' },
  { key: 'video', label: 'Videos', icon: '🎥' },
]

export function TravelerGallery({ tripId, tripName }){
  const [tab, setTab] = React.useState('all')
  const { data: allItems = [], isLoading } = useTravelerMedia(tripId, null)
  const items = tab === 'all' ? allItems : allItems.filter((m) => m.mediaType === tab)
  const photos = items.filter((m) => m.mediaType === 'photo')
  const [photoIndex, setPhotoIndex] = React.useState(null)

  if (!isLoading && allItems.length === 0) {
    return null
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold">Gallery by Travelers</h2>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter gallery by media type">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setTab(key); setPhotoIndex(null) }}
            aria-pressed={tab === key}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              tab === key
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            )}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-6 columns-2 gap-3 sm:columns-3 lg:columns-4">
          {Array.from({length:6}).map((_,i)=>(
            <div key={i} className="mb-3 h-48 animate-pulse break-inside-avoid rounded-xl bg-muted" />
          ))}
        </div>
      ) : items.length===0 ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          No traveler {tab==='video'?'videos':tab==='photo'?'photos':'photos or videos'} yet.
        </p>
      ) : (
        <div className="mt-6 columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
          {items.map((m)=>(
            <div key={m.id} className="break-inside-avoid">
              {m.mediaType==='video' ? (
                <video
                  src={resolveImageSrc(m) || m.url}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  aria-label={m.altText || m.caption || `Traveler video for ${tripName}`}
                  className="w-full rounded-xl bg-black"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPhotoIndex(photos.findIndex((p) => p.id === m.id))}
                  aria-label={`View photo${m.altText ? `: ${m.altText}` : ''}`}
                  className="block w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <img
                    src={resolveImageSrc(m)}
                    alt={m.altText || m.caption || tripName}
                    loading="lazy"
                    className="w-full rounded-xl object-cover"
                  />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {photoIndex !== null && photos[photoIndex] && (
        <Lightbox
          images={photos}
          index={photoIndex}
          onClose={() => setPhotoIndex(null)}
          onPrev={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
          onNext={() => setPhotoIndex((i) => (i + 1) % photos.length)}
        />
      )}
    </div>
  )
}
