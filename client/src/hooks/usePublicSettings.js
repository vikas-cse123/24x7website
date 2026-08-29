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
    queryFn: async () => {
      const { data } = await publicSettingsApi.get()
      return data.data ?? null
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const contact = query.data?.contact ?? DEFAULT_CONTACT
  const promotionalBanner = query.data?.promotionalBanner ?? DEFAULT_PROMOTIONAL_BANNER

  return { ...query, contact, promotionalBanner }
}