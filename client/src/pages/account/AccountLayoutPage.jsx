import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/ui'
import { useSeo } from '@/lib/seo'

// Customer account shell. Private area — noindex (ADR-017).
export function AccountLayoutPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const openAuthModal = useUIStore((s) => s.openAuthModal)

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
            Login
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-8 lg:py-12">
      <div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </Container>
  )
}
