import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { AdminSidebar, MobileAdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

// Admin shell: responsive sidebar (fixed on lg+, drawer on mobile), header, and
// page content. Routes render through <Outlet />.
export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <AdminSidebar />
      <MobileAdminSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 bg-[#f8fafc] p-4 lg:px-8 lg:py-6 min-w-0 overflow-hidden">
          <div className="w-full min-w-0 max-w-full min-h-[calc(100vh-48px-24px)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}