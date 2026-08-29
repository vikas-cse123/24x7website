import * as React from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { resolveImageSrc } from '@/lib/media'

// Shared fullscreen image lightbox. Keyboard accessible (Esc/arrow keys),
// scroll-locks the page, shows a position counter. Used by the trip gallery
// and the destination gallery so both behave consistently. Resolves stored
// media URLs (S3 object URLs or legacy URLs) with a plain URL fallback.
export function Lightbox({ images, index, onClose, onPrev, onNext }) {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, onPrev, onNext])

  const img = images[index]
  const src = resolveImageSrc(img, { w: 1600 }) || img?.url || img?.secureUrl || ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onPrev() }}
        aria-label="Previous image"
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:left-4"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      {src ? (
        <img
          src={src}
          alt={img?.alt || img?.altText || ''}
          className="max-h-[85vh] max-w-[90vw] object-contain"
          onClick={(e) => e.stopPropagation()}
          loading="lazy"
        />
      ) : (
        <div className="text-white/60">Image unavailable</div>
      )}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
        {index + 1} / {images.length}
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onNext() }}
        aria-label="Next image"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:right-4"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  )
}