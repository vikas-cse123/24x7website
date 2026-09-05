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
          'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-foreground/90 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          open && 'text-primary'
        )}
      >
        {item.icon && (
          <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center text-[15px] leading-none">
            {item.icon}
          </span>
        )}
        {item.label}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-border bg-popover p-1.5 shadow-card">
          {item.children.map((child) => (
            <Link
              key={child.label}
              to={child.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {child.icon && (
                <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center text-[15px] leading-none">
                  {child.icon}
                </span>
              )}
              <span>{child.label}</span>
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
    <nav
      aria-label="Primary"
      className={cn('hidden w-full items-center justify-center gap-0.5 lg:flex', className)}
    >
      {NAV_ITEMS.map((item) =>
        item.children ? (
          <Dropdown key={item.label} item={item} />
        ) : (
          <Link
            key={item.label}
            to={item.href}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-foreground/90 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              pathname === item.href && 'text-primary'
            )}
          >
            {item.icon && (
              <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center text-[15px] leading-none">
                {item.icon}
              </span>
            )}
            {item.label}
          </Link>
        )
      )}
    </nav>
  )
}