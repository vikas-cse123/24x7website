import * as React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { UserCog, CalendarRange, Users, Star, Heart, Bell, LogIn, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/ui'
import { useSeo } from '@/lib/seo'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/account', label: 'Profile', icon: UserCog, end: true },
  { to: '/account/bookings', label: 'My Bookings', icon: CalendarRange },
  { to: '/account/travellers', label: 'Travellers', icon: Users },
  { to: '/account/reviews', label: 'My Reviews', icon: Star },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/notifications', label: 'Notifications', icon: Bell },
]

// Customer account shell. Private area — noindex (ADR-017).
export function AccountLayoutPage() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const openAuthModal = useUIStore((s) => s.openAuthModal)
  const navigate = useNavigate()

  useSeo({ title: 'My Account', noindex: true })

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) openAuthModal()
  }, [authLoading, isAuthenticated, openAuthModal])

  if (authLoading) {
    return (
      <Container className="py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-96 animate-pulse rounded-xl bg-muted" />
      </Container>
    )
  }

  if (!isAuthenticated) {
    return (
      <Container className="py-20">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-card">
          <LogIn className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold">Login to view your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your profile, bookings and saved travellers.
          </p>
          <Button className="mt-6 w-full" onClick={() => openAuthModal()}>
            Login / Sign Up
          </Button>
        </div>
      </Container>
    )
  }

  async function handleLogout() {
    await logout()
    toast.success('Logged out')
    navigate('/')
  }

  return (
    <Container className="py-8 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Profile, bookings and saved travellers — all in one place.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Logout
        </Button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Sidebar nav (desktop) / pill tabs (mobile) */}
        <nav aria-label="Account sections" className="lg:h-fit lg:rounded-xl lg:border lg:border-border lg:bg-card lg:p-2 lg:shadow-card">
          <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <li key={to} className="shrink-0 lg:shrink">
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:rounded-lg',
                      isActive
                        ? 'bg-primary text-primary-foreground lg:bg-primary/10 lg:text-primary'
                        : 'border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground lg:border-transparent lg:bg-transparent'
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </Container>
  )
}
