import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Accessible slide-in panel (used for the mobile navigation drawer).
// Mirrors the Dialog primitive's behaviour: backdrop, Esc-to-close, scroll lock,
// close button, aria attributes.
export function Sheet({ open, onOpenChange, side = 'right', children }) {
  React.useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onOpenChange?.(false)
    }
    document.addEventListener('keydown', onKeyDown)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'absolute inset-y-0 flex w-full max-w-xs flex-col bg-card text-card-foreground shadow-xl',
          side === 'right' ? 'right-0' : 'left-0'
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

export function SheetContent({ className, children, onClose, showClose = true, ...props }) {
  return (
    <div className={cn('relative flex flex-col', className)} {...props}>
      {showClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  )
}
