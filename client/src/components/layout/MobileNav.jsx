import * as React from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Logo } from '@/components/brand/Logo'
import { HeaderSearch } from '@/components/layout/HeaderSearch'
import { Button } from '@/components/ui/button'
import { NAV_ITEMS } from '@/lib/nav'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

function MobileNavItem({ item, onNavigate }) {
  const [expanded, setExpanded] = React.useState(false)

  if (item.children) {
    return (
      <div>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {item.label}
          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
        </button>
        {expanded && (
          <div className="ml-3 border-l border-border pl-3">
            {item.children.map((child) => (
              <Link
                key={child.href}
                to={child.href}
                onClick={onNavigate}
                className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className="block rounded-md px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {item.label}
    </Link>
  )
}

export function MobileNav({ open, onOpenChange }) {
  const { isAuthenticated } = useAuth()
  const openAuthModal = useUIStore((s) => s.openAuthModal)

  const close = React.useCallback(() => onOpenChange(false), [onOpenChange])

  function handleLogin() {
    close()
    openAuthModal()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetContent onClose={close}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Logo imgClassName="h-8" />
        </div>

        <div className="px-4 py-4">
          <HeaderSearch />
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <MobileNavItem item={item} onNavigate={close} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-border p-4">
          {isAuthenticated && (
            <div className="mb-3 flex items-center justify-center"><NotificationBell /></div>
          )}
          {isAuthenticated ? (
            <Link to="/account" onClick={close} className="block">
              <Button variant="outline" className="w-full">
                My Account
              </Button>
            </Link>
          ) : (
            <Button className="w-full" onClick={handleLogin}>
              Login / Sign Up
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
