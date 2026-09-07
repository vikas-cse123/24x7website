import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { PromoBanner } from '@/components/layout/PromoBanner'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { LoginModal } from '@/components/auth/LoginModal'
import { PlanTripModal } from '@/components/enquiry/PlanTripModal'
import { useUIStore } from '@/stores/ui'
import { useAuth } from '@/hooks/useAuth'
import { AUTO_ENQUIRY_DELAY_MS, AUTO_ENQUIRY_NEXT_SHOW_KEY } from '@/lib/autoEnquiry'

// Public website shell: promotional banner (very top), header (logo + search +
// phone + login + navigation), page content, footer. The LoginModal and the
// "Plan Your Dream Trip" enquiry modal are mounted here so they can be opened
// from anywhere in the public site. The session is restored on boot.
export function PublicLayout() {
  const authModalOpen = useUIStore((s) => s.authModalOpen)
  const setAuthModalOpen = useUIStore((s) => s.setAuthModalOpen)
  const { fetchMe } = useAuth()

  React.useEffect(() => {
    fetchMe()
  }, [fetchMe])

  // Automatic lead-enquiry popup — uses centralized AUTO_ENQUIRY_DELAY_MS (3 min)
  // Public only (PublicLayout is not mounted for /admin), not while already open,
  // respects localStorage so refresh/navigation doesn't cause immediate popup,
  // and resets timer on close. Manual CTA (PlanTripTrigger) still works via same store.
  const planTripOpen = useUIStore((s) => s.planTripOpen)
  const openPlanTrip = useUIStore((s) => s.openPlanTrip)

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (planTripOpen) return undefined

    let delay = AUTO_ENQUIRY_DELAY_MS
    try {
      const stored = window.localStorage.getItem(AUTO_ENQUIRY_NEXT_SHOW_KEY)
      if (stored) {
        const nextAt = parseInt(stored, 10)
        if (!Number.isNaN(nextAt)) {
          const remaining = nextAt - Date.now()
          if (remaining > 0) delay = remaining
        }
      } else {
        window.localStorage.setItem(AUTO_ENQUIRY_NEXT_SHOW_KEY, String(Date.now() + AUTO_ENQUIRY_DELAY_MS))
      }
    } catch {}

    const timer = window.setTimeout(() => {
      const { planTripOpen: isOpen, openPlanTrip: doOpen } = useUIStore.getState()
      if (isOpen) return
      try {
        const s = window.localStorage.getItem(AUTO_ENQUIRY_NEXT_SHOW_KEY)
        if (s) {
          const n = parseInt(s, 10)
          if (!Number.isNaN(n) && Date.now() < n - 500) return
        }
      } catch {}
      doOpen(null)
      try {
        window.localStorage.setItem(AUTO_ENQUIRY_NEXT_SHOW_KEY, String(Date.now() + AUTO_ENQUIRY_DELAY_MS))
      } catch {}
    }, delay)

    return () => window.clearTimeout(timer)
  }, [planTripOpen, openPlanTrip])

  const prevOpenRef = React.useRef(planTripOpen)
  React.useEffect(() => {
    if (prevOpenRef.current && !planTripOpen) {
      try {
        window.localStorage.setItem(AUTO_ENQUIRY_NEXT_SHOW_KEY, String(Date.now() + AUTO_ENQUIRY_DELAY_MS))
      } catch {}
    }
    prevOpenRef.current = planTripOpen
  }, [planTripOpen])

  return (
    <div className="flex min-h-screen flex-col">
      <PromoBanner />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <LoginModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <PlanTripModal />
    </div>
  )
}
