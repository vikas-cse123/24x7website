import * as React from 'react'
import { cn } from '@/lib/utils'
import { resolveImageSrc, resolveSrcSet } from '@/lib/cloudinary'
import { BrandLogoImage } from '@/components/brand/BrandLogoImage'

// Image can be a string URL (legacy) or an image object {url, secureUrl, publicId, alt}
export function DestinationImage({ src, alt = '', image, className, imgClassName, width, loading = 'lazy' }) {
  const [errored, setErrored] = React.useState(false)
  const imgObj = image || (typeof src === 'string' ? { url: src, alt } : src ? { ...src, alt: src.alt || alt } : null)
  const resolvedSrc = resolveImageSrc(imgObj, { w: width || 800 })
  const srcSet = resolveSrcSet(imgObj)
  const showImage = (resolvedSrc || src) && !errored
  const finalSrc = resolvedSrc || src

  return (
    <div className={cn('flex items-center justify-center overflow-hidden bg-muted', className)}>
      {showImage ? (
        <img
          src={finalSrc}
          srcSet={srcSet}
          sizes={width ? `${width}px` : "(max-width: 640px) 100vw, 50vw"}
          alt={alt || imgObj?.alt || ''}
          loading={loading}
          onError={() => setErrored(true)}
          className={cn('h-full w-full object-cover', imgClassName)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-muted to-muted">
          <BrandLogoImage imgClassName="h-10 w-auto opacity-40" />
        </div>
      )}
    </div>
  )
}
