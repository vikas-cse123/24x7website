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

  // Mobile header search — opened via BottomNav Search icon
  mobileSearchOpen: false,
  openMobileSearch: () => set({ mobileSearchOpen: true }),
  closeMobileSearch: () => set({ mobileSearchOpen: false }),
  toggleMobileSearch: () => set((s) => ({ mobileSearchOpen: !s.mobileSearchOpen })),
  setMobileSearchOpen: (open) => set({ mobileSearchOpen: open }),

  // Reviews navigation tick — increments on every Reviews click to force
  // DeferredSection re-observe even when URL already /#reviews (history.pushState
  // alone does not create a new React Router location.key)
  reviewsNavTick: 0,
  bumpReviewsNavTick: () => set((s) => ({ reviewsNavTick: s.reviewsNavTick + 1 })),
}))
