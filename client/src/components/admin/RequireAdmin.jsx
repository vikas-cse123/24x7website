import * as React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AUTH_STATUS } from '@/stores/auth'

// Frontend guard for the /admin area. This is UX protection only; the real
// security boundary is requireAuth + requireRole('admin') on the backend.
export function RequireAdmin({ children }) {
  const { status, user, fetchMe } = useAuth()
  const booted = React.useRef(false)

  // Deep links to /admin mount without PublicLayout, so ensure the session is
  // restored (fetchMe) before deciding access.
  React.useEffect(() => {
    if (status === AUTH_STATUS.LOADING && !booted.current) {
      booted.current = true
      fetchMe()
    }
  }, [status, fetchMe])

  if (status === AUTH_STATUS.LOADING) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (status !== AUTH_STATUS.AUTHENTICATED || !user) {
    return <Navigate to="/" replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}