import * as React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, LogOut, User as UserIcon, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { ADMIN_NAV } from '@/lib/adminNav'

function findPageLabel(pathname) {
  const flat = []
  for (const entry of ADMIN_NAV) {
    if (entry.items) {
      flat.push(...entry.items.map((i) => ({ label: i.label, href: i.href })))
    } else {
      flat.push({ label: entry.label, href: entry.href })
    }
  }
  const match = flat.find((i) => (i.href === '/admin' ? pathname === '/admin' : pathname.startsWith(i.href)))
  return match?.label || 'Admin'
}

export function AdminHeader({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const pageLabel = findPageLabel(pathname)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb / page title */}
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="hidden text-muted-foreground sm:inline">Admin</span>
        <ChevronRight className="hidden h-3.5 w-3.5 text-muted-foreground sm:inline" />
        <span className="truncate font-medium">{pageLabel}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <UserIcon className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium">+{user?.countryCode} {user?.mobile}</p>
            <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  )
}