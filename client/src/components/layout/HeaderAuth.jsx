import * as React from 'react'
import { Link } from 'react-router-dom'
import { User as UserIcon, LogOut, ChevronDown, UserCog, CalendarRange, Users, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { useUIStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

const MENU_LINKS = [
  { to: '/account', label: 'My Account', icon: UserCog },
  { to: '/account/bookings', label: 'My Bookings', icon: CalendarRange },
  { to: '/account/travellers', label: 'Travellers', icon: Users },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
]

function AuthenticatedMenu() {
  const { user, logout } = useAuth()
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
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background py-1.5 pl-1.5 pr-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserIcon className="h-4 w-4" />
        </span>
        <span className="hidden sm:inline">{user?.name || user?.mobile || 'Account'}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border bg-popover p-1.5 shadow-card">
          <div className="border-b border-border px-3 py-2 text-sm">
            <p className="font-medium">{user?.name || 'Traveller'}</p>
            <p className="text-xs text-muted-foreground">
              +{user?.countryCode} {user?.mobile}
            </p>
          </div>
          {MENU_LINKS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={async () => {
              setOpen(false)
              await logout()
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export function HeaderAuth({ className }) {
  const { isAuthenticated, isLoading } = useAuth()
  const openAuthModal = useUIStore((s) => s.openAuthModal)

  if (isLoading) {
    return (
      <div className={cn('h-9 w-24 animate-pulse rounded-full bg-muted', className)} />
    )
  }

  if (isAuthenticated) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <NotificationBell />
        <AuthenticatedMenu />
      </div>
    )
  }

  return (
    <Button
      className={cn(
        'h-10 min-w-[88px] rounded-full bg-foreground px-6 text-background shadow-sm transition-colors hover:bg-foreground/85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      onClick={openAuthModal}
    >
      Login
    </Button>
  )
}
