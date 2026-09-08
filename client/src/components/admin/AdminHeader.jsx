import * as React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, LogOut, UserRound, Phone, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { ADMIN_NAV } from '@/lib/adminNav'
import { formatPhone } from '@/lib/phone'

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
    <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:px-4">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Breadcrumb */}
      <div className="flex min-w-0 items-center gap-1 text-xs">
        <span className="hidden rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 sm:inline">Admin</span>
        <ChevronRight className="hidden h-3 w-3 text-slate-400 sm:inline" />
        <span className="truncate text-sm font-semibold tracking-tight">{pageLabel}</span>
      </div>

      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        <a
          href={`tel:${(user?.mobile || '').replace(/\D/g, '')}`}
          className="hidden items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 sm:inline-flex"
        >
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          <span>{formatPhone(user?.mobile, user?.countryCode) || '—'}</span>
        </a>
        <div className="hidden items-center gap-2.5 sm:flex">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-slate-50 text-slate-600">
            <UserRound className="h-4 w-4" />
          </span>
          <div className="leading-none">
            <p className="text-xs font-semibold capitalize text-slate-900">{user?.role || 'Admin'}</p>
            <p className="text-[11px] text-slate-500">Admin</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="h-8 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </Button>
      </div>
    </header>
  )
}