import * as React from 'react'
import { Images } from 'lucide-react'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { Lightbox } from '@/components/ui/lightbox'
import { cn } from '@/lib/utils'

export function TripGallery({ heroImage, gallery = [], tripName }) {
  const allImages = [heroImage, ...gallery].filter(Boolean).filter(i => i.url || i.secureUrl || i.publicId)
  const [lightboxIndex, setLightboxIndex] = React.useState(null)

  if (allImages.length === 0) {
    return <div className="flex aspect-[16/7] items-center justify-center rounded-2xl bg-muted"><Images className="h-12 w-12 text-muted-foreground/30" /></div>
  }

  const primary = allImages[0]
  const supporting = allImages.slice(1, 5)
  const remaining = Math.max(0, allImages.length - 5)

  const open = (idx) => setLightboxIndex(idx)
  const close = () => setLightboxIndex(null)
  const prev = () => setLightboxIndex(i => (i - 1 + allImages.length) % allImages.length)
  const next = () => setLightboxIndex(i => (i + 1) % allImages.length)

  return (
    <>
      {/* Desktop: hero left + 2x2 grid right */}
      <div className="overflow-hidden rounded-2xl">
        <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
          <button onClick={()=>open(0)} className="relative aspect-[16/10] overflow-hidden md:aspect-[4/3]">
            <DestinationImage image={primary} alt={primary.alt || tripName} className="h-full w-full" width={800} />
            <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white flex items-center gap-1.5"><Images className="h-3.5 w-3.5" />{allImages.length} photos</span>
          </button>
          <div className="hidden grid-cols-2 gap-2 md:grid">
            {supporting.map((img,i) => {
              const idx = i+1
              return (
                <button key={idx} onClick={()=>open(idx)} className="relative aspect-square overflow-hidden">
                  <DestinationImage image={img} alt={img.alt || `${tripName} ${idx+1}`} className="h-full w-full" width={400} />
                  {idx===4 && remaining>0 && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-semibold text-white">+{remaining} more</span>
                  )}
                </button>
              )
            })}
            {supporting.length===0 && <div className="aspect-square bg-muted" />}
            {supporting.length===1 && <div className="aspect-square bg-muted" />}
            {supporting.length===2 && <div className="aspect-square bg-muted hidden sm:block" />}
            {supporting.length===3 && <div className="aspect-square bg-muted" />}
          </div>
        </div>
        {/* Mobile thumbnails strip */}
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:hidden">
          {allImages.slice(0,8).map((img,i)=>(
            <button key={i} onClick={()=>open(i)} className={cn("h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2", lightboxIndex===i ? "border-primary" : "border-transparent")}>
              <DestinationImage image={img} alt={img.alt||''} className="h-full w-full" width={200} />
            </button>
          ))}
        </div>
      </div>
      {lightboxIndex !== null && <Lightbox images={allImages} index={lightboxIndex} onClose={close} onPrev={prev} onNext={next} />}
    </>
  )
}
