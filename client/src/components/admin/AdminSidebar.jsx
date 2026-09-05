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
          'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        )
      }
    >
      <item.icon className="h-3.5 w-3.5 shrink-0" />
      {item.label}
    </NavLink>
  )
}

function NavGroup({ group, onNavigate }) {
  return (
    <div>
      <p className="px-2.5 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {group.section}
      </p>
      <ul className="mt-1 space-y-0.5">
        {group.items.map((item) => (
          <li key={item.href}>
            <NavItem item={item} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </div>
  )
}

// The navigation content, reused by the desktop aside and the mobile drawer.
export function AdminSidebarNav({ onNavigate }) {
  const [dashboard, ...groups] = ADMIN_NAV
  return (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-2.5 pb-4">
      <ul className="space-y-0.5">
        <li>
          <NavItem item={dashboard} onNavigate={onNavigate} />
        </li>
      </ul>
      {groups.map((group) => (
        <NavGroup key={group.section} group={group} onNavigate={onNavigate} />
      ))}
    </nav>
  )
}

function SidebarHeader({ className }) {
  return (
    <div className={cn('flex items-center gap-2.5 px-3 py-3.5', className)}>
      <div className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-white">
        <span className="text-xs font-black">24</span>
      </div>
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
      <div className="border-t border-slate-100 p-3">
        <p className="text-[11px] font-medium text-slate-400">© 2025 • v0.1.0</p>
      </div>
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