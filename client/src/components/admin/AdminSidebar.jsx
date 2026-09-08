import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import { Logo } from '@/components/brand/Logo'
import { ADMIN_NAV } from '@/lib/adminNav'
import { cn } from '@/lib/utils'

function NavItem({ item, onNavigate }) {
  return (
    <NavLink
      to={item.href}
      end={item.exact}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive
            ? 'bg-emerald-50 font-semibold text-emerald-700'
            : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-emerald-600' : 'text-slate-400')} />
          {item.label}
        </>
      )}
    </NavLink>
  )
}

// The navigation content, reused by the desktop aside and the mobile drawer.
export function AdminSidebarNav({ onNavigate }) {
  const flatItems = (() => {
    const [dashboard, ...groups] = ADMIN_NAV
    return [dashboard, ...groups.flatMap((g) => g.items)]
  })()
  return (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-3">
      <ul className="space-y-1">
        {flatItems.map((item) => (
          <li key={item.href}>
            <NavItem item={item} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

function SidebarHeader({ className }) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-4', className)}>
      <Logo imgClassName="h-8 w-auto" />
      <div className="leading-none">
        <p className="text-sm font-bold tracking-tight">24x7Chhutti</p>
        <p className="text-[11px] font-medium text-slate-500">Admin</p>
      </div>
    </div>
  )
}

// Desktop sidebar (lg+).
export function AdminSidebar({ className }) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex',
        className
      )}
    >
      <SidebarHeader className="border-b border-slate-100" />
      <AdminSidebarNav />
    </aside>
  )
}

// Mobile sidebar drawer.
export function MobileAdminSidebar({ open, onOpenChange }) {
  const close = React.useCallback(() => onOpenChange(false), [onOpenChange])
  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="left">
      <div className="flex h-full flex-col bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Logo imgClassName="h-8" />
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <AdminSidebarNav onNavigate={close} />
      </div>
    </Sheet>
  )
}