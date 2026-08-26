import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { AdminSidebar, MobileAdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

// Admin shell: responsive sidebar (fixed on lg+, drawer on mobile), header, and
// page content. Routes render through <Outlet />.
export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      <MobileAdminSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}