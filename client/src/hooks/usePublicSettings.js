import { useQuery } from '@tanstack/react-query'
import { publicSettingsApi } from '@/services/settings'
import { DEFAULT_CONTACT, DEFAULT_PROMOTIONAL_BANNER } from '@/lib/settings'

// Dedicated query key for the aggregate public settings (logo + contact +
// promotional banner). Admin mutations invalidate this key so the header and
// banner update immediately after a save.
export const PUBLIC_SETTINGS_QUERY_KEY = ['settings', 'public']

// Centralized public settings source with guaranteed defaults — the website
// must never go blank because a setting is missing or the API failed.
export function usePublicSettings() {
  const query = useQuery({
    queryKey: PUBLIC_SETTINGS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const { data } = await publicSettingsApi.get({ signal })
      return data.data ?? null
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const contact = query.data?.contact ?? DEFAULT_CONTACT
  // Promotional banner must NEVER flash the hardcoded DEFAULT while loading.
  // During pending, return null so the banner shows a skeleton/empty state.
  // After loading, return the saved banner or null (hidden) — never the stale default.
  // This prevents the ~1s flash of "Early Bird Sale — Save on upcoming group trips"
  // on every hard refresh.
  const isBannerLoading = query.isPending
  const promotionalBanner = isBannerLoading
    ? null
    : (query.data?.promotionalBanner ?? null)

  return { ...query, contact, promotionalBanner, isBannerLoading }
}