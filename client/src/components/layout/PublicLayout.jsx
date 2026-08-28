import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { LoginModal } from '@/components/auth/LoginModal'
import { PlanTripModal } from '@/components/enquiry/PlanTripModal'
import { useUIStore } from '@/stores/ui'
import { useAuth } from '@/hooks/useAuth'

// Public website shell: header, page content, footer. The LoginModal and the
// "Plan Your Dream Trip" enquiry modal are mounted here so they can be opened
// from anywhere in the public site. The session is restored on boot.
export function PublicLayout() {
  const authModalOpen = useUIStore((s) => s.authModalOpen)
  const setAuthModalOpen = useUIStore((s) => s.setAuthModalOpen)
  const { fetchMe } = useAuth()

  React.useEffect(() => {
    fetchMe()
  }, [fetchMe])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <LoginModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <PlanTripModal />
    </div>
  )
}
