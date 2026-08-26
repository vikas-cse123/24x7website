import * as React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { NAV_ITEMS } from '@/lib/nav'
import { cn } from '@/lib/utils'

function Dropdown({ item }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-0.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        {item.label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-52 rounded-lg border border-border bg-popover p-1.5 shadow-card">
          {item.children.map((child) => (
            <Link
              key={child.href}
              to={child.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function SiteNav({ className }) {
  const { pathname } = useLocation()

  return (
    <nav aria-label="Primary" className={cn('hidden items-center gap-1 lg:flex', className)}>
      {NAV_ITEMS.map((item) =>
        item.children ? (
          <Dropdown key={item.label} item={item} />
        ) : (
          <Link
            key={item.label}
            to={item.href}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              pathname === item.href && 'text-primary'
            )}
          >
            {item.label}
          </Link>
        )
      )}
    </nav>
  )
}
