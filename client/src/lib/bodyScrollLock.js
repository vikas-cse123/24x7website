// Simple reference-counted body scroll lock for modals/dialogs.
// Prevents premature restore when multiple overlays are open
// (e.g. PlanTripModal + Lightbox). Only the last unlock restores.

let lockCount = 0
let prevOverflow = ''
let prevPaddingRight = ''

function getScrollbarWidth() {
  return window.innerWidth - document.documentElement.clientWidth
}

export function lockBodyScroll() {
  if (typeof document === 'undefined') return
  if (lockCount === 0) {
    prevOverflow = document.body.style.overflow
    prevPaddingRight = document.body.style.paddingRight
    const sbWidth = getScrollbarWidth()
    // Prevent layout shift when scrollbar disappears (desktop)
    if (sbWidth > 0) {
      document.body.style.paddingRight = `${sbWidth}px`
    }
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = prevOverflow
    document.body.style.paddingRight = prevPaddingRight
  }
}
