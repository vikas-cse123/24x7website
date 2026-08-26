import { create } from 'zustand'

// Global UI state, e.g. which overlays are open. Kept separate from auth state.
export const useUIStore = create((set) => ({
  authModalOpen: false,
  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),
  setAuthModalOpen: (open) => set({ authModalOpen: open }),
}))
