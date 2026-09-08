import { create } from 'zustand'
import { authApi } from '@/services/auth'

export const AUTH_STATUS = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
}

export const useAuthStore = create((set, get) => ({
  user: null,
  status: AUTH_STATUS.LOADING,

  setUser: (user) => set({ user, status: user ? AUTH_STATUS.AUTHENTICATED : AUTH_STATUS.UNAUTHENTICATED }),
  setStatus: (status) => set({ status }),
  setAuthenticated: (user) => set({ user, status: AUTH_STATUS.AUTHENTICATED }),
  clearSession: () => set({ user: null, status: AUTH_STATUS.UNAUTHENTICATED }),

  // Restore the session on app boot by asking the server for the current user.
  // Deduped: if status already resolved, do not re-request.
  _fetchPromise: null,
  fetchMe: async () => {
    const { status, _fetchPromise } = get()
    if (_fetchPromise) return _fetchPromise
    if (status !== AUTH_STATUS.LOADING) return
    const p = (async () => {
      try {
        const { data } = await authApi.me()
        set({ user: data.data.user, status: AUTH_STATUS.AUTHENTICATED })
      } catch {
        set({ user: null, status: AUTH_STATUS.UNAUTHENTICATED })
      } finally {
        set({ _fetchPromise: null })
      }
    })()
    set({ _fetchPromise: p })
    return p
  },

  logout: async () => {
    try {
      await authApi.logout()
    } finally {
      get().clearSession()
    }
  },
}))
