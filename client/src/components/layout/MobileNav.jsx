import * as React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { NAV_ITEMS } from '@/lib/nav'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/ui'
import { IndianFlagIcon } from '@/components/icons/IndianFlagIcon'
import { cn } from '@/lib/utils'

function NavIcon({ icon }) {
  if (!icon) return null
  if (icon === 'indian-flag') return <IndianFlagIcon className="h-4 w-4" />
  return <span aria-hidden="true" className="text-[15px] leading-none">{icon}</span>
}

function MobileNavItem({ item, onNavigate }) {
  const [expanded, setExpanded] = React.useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  if (item.children) {
    return (
      <div>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center gap-2.5">
            {item.icon && (
              <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center text-[15px] leading-none">
                <NavIcon icon={item.icon} />
              </span>
            )}
            {item.label}
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
        </button>
        {expanded && (
          <div className="ml-3 border-l border-border pl-3">
            {item.children.map((child) => {
              const isReviews = child.href === '/#reviews'
              const handleClick = (e) => {
                if (isReviews) {
                  e.preventDefault()
                  onNavigate()
                  useUIStore.getState().bumpReviewsNavTick()
                  navigate('/#reviews', { state: { reviewsNavTick: Date.now() } })
                  return
                }
                onNavigate()
              }
              return (
                <Link
                  key={child.href}
                  to={child.href}
                  onClick={handleClick}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {child.icon && (
                    <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center text-[15px] leading-none">
                      <NavIcon icon={child.icon} />
                    </span>
                  )}
                  {child.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {item.icon && (
        <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center text-[15px] leading-none">
          <NavIcon icon={item.icon} />
        </span>
      )}
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
    <Sheet open={open} onOpenChange={onOpenChange} side="left">
      <SheetContent onClose={close}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Logo imgClassName="h-8" />
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
              Login
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
