import * as React from 'react'
import { X, ChevronLeft, ChevronRight, Images } from 'lucide-react'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { resolveImageSrc } from '@/lib/cloudinary'
import { cn } from '@/lib/utils'

function Lightbox({ images, index, onClose, onPrev, onNext }) {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose, onPrev, onNext])

  const img = images[index]
  const src = resolveImageSrc(img, { w: 1600 }) || img.url || img.secureUrl

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X className="h-6 w-6" /></button>
      <button onClick={(e)=>{e.stopPropagation(); onPrev()}} aria-label="Previous" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:left-4"><ChevronLeft className="h-6 w-6" /></button>
      <img src={src} alt={img.alt || img.altText || ''} className="max-h-[85vh] max-w-[90vw] object-contain" onClick={e=>e.stopPropagation()} loading="lazy" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{index+1} / {images.length}</div>
      <button onClick={(e)=>{e.stopPropagation(); onNext()}} aria-label="Next" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:right-4"><ChevronRight className="h-6 w-6" /></button>
    </div>
  )
}

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
