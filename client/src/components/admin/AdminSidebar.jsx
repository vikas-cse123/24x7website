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
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )
      }
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </NavLink>
  )
}

function NavGroup({ group, onNavigate }) {
  return (
    <div>
      <p className="px-3 pt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {group.section}
      </p>
      <ul className="mt-1.5 space-y-0.5">
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
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-6">
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
    <div className={cn('flex items-center justify-between px-4 py-4', className)}>
      <Logo imgClassName="h-9" />
    </div>
  )
}

// Desktop sidebar (lg+).
export function AdminSidebar({ className }) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex',
        className
      )}
    >
      <SidebarHeader className="border-b border-border" />
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