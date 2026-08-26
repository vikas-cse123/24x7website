import { useAuthStore, AUTH_STATUS } from '@/stores/auth'

// Reusable auth hook so any component/page can determine auth state.
export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const status = useAuthStore((s) => s.status)
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)
  const clearSession = useAuthStore((s) => s.clearSession)
  const logout = useAuthStore((s) => s.logout)
  const fetchMe = useAuthStore((s) => s.fetchMe)

  return {
    user,
    status,
    isAuthenticated: status === AUTH_STATUS.AUTHENTICATED,
    isLoading: status === AUTH_STATUS.LOADING,
    setAuthenticated,
    clearSession,
    logout,
    fetchMe,
  }
}
