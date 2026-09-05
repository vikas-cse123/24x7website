import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function MediaPreview({ src, alt }) {
  if (!src) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-xs text-muted-foreground">
        No media yet
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <img src={src} alt={alt || ''} className="aspect-[16/10] w-full object-cover" loading="lazy" />
    </div>
  )
}

export function SingleMediaCard({ label, hint, value, onChange, onUploaded, folder, children }) {
  const src = value?.secureUrl || value?.url
  const hasImage = !!src

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {hasImage ? (
        <>
          <MediaPreview src={src} alt={value.alt} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="h-8 flex-1 rounded-lg" onClick={() => document.getElementById(`media-${label}`)?.click()}>
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onChange({ url: '', secureUrl: '', publicId: '', alt: '' })}
            >
              Remove
            </Button>
          </div>
          <div className="hidden">
            {children}
          </div>
        </>
      ) : (
        <div id={`media-${label}`} className="contents">
          {children}
        </div>
      )}
    </div>
  )
}

export function GalleryCard({ label, hint, value, onChange, onUploaded, folder }) {
  // This is a wrapper that will be replaced by ImageUploader's grid; keep simple
  return null
}
