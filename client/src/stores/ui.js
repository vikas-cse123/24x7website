import { create } from 'zustand'

// Global UI state, e.g. which overlays are open. Kept separate from auth state.
export const useUIStore = create((set) => ({
  authModalOpen: false,
  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),
  setAuthModalOpen: (open) => set({ authModalOpen: open }),

  // "Plan Your Dream Trip" custom-trip enquiry modal. `planTripDestinationId`
  // pre-selects a destination when opened contextually (e.g. from a destination
  // page); global triggers leave it null.
  planTripOpen: false,
  planTripDestinationId: null,
  openPlanTrip: (destinationId = null) =>
    set({ planTripOpen: true, planTripDestinationId: destinationId || null }),
  closePlanTrip: () => set({ planTripOpen: false }),
  setPlanTripDestinationId: (destinationId) => set({ planTripDestinationId: destinationId || null }),
}))
