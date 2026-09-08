import { useQuery } from '@tanstack/react-query'
import { brandingApi } from '@/services/settings'
import { BRAND_NAME, BRAND_LOGO_FALLBACK } from '@/lib/branding'

// Dedicated query key — the single source of truth for the active branding.
// Admin mutations invalidate this exact key after save/reset so every public
// component immediately receives the new logo (no cache collisions).
export const BRANDING_QUERY_KEY = ['branding']

// Centralized active logo source. Returns the admin-selected logo when one is
// configured; otherwise (or on API failure) the guaranteed /logo.jpg fallback.
// The website must NEVER go blank because branding failed.
export function useBranding() {
  const query = useQuery({
    queryKey: BRANDING_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const { data } = await brandingApi.get({ signal })
      return data.data?.logo ?? null
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const logo = {
    url: query.data?.url || BRAND_LOGO_FALLBACK,
    alt: query.data?.alt || BRAND_NAME,
  }

  return { logo, ...query }
}