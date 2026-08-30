import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicWhatsappApi } from '@/services/settings'
import { DEFAULT_WHATSAPP } from '@/lib/settings'

function buildWhatsappUrl(phoneNumber, prefilledMessage) {
  const digits = String(phoneNumber || '').replace(/\D/g, '')
  if (!digits) return null
  const text = encodeURIComponent(prefilledMessage || '')
  return text ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/${digits}`
}

const sizeClasses = {
  small: 'h-11 w-11',
  medium: 'h-14 w-14',
  large: 'h-[4.25rem] w-[4.25rem]',
}

const iconSizes = {
  small: 'h-6 w-6',
  medium: 'h-7 w-7',
  large: 'h-8 w-8',
}

function normalize(data) {
  if (!data || typeof data !== 'object') return DEFAULT_WHATSAPP
  return {
    enabled: typeof data.enabled === 'boolean' ? data.enabled : DEFAULT_WHATSAPP.enabled,
    // Saved values are used as-is (empty stays empty → button hides);
    // defaults only fill in for fields the API never returned.
    phoneNumber: data.phoneNumber != null ? String(data.phoneNumber).replace(/\D/g, '') : DEFAULT_WHATSAPP.phoneNumber,
    prefilledMessage: typeof data.prefilledMessage === 'string' ? data.prefilledMessage : DEFAULT_WHATSAPP.prefilledMessage,
    iconUrl: data.iconUrl || null,
    position: data.position === 'bottom-left' ? 'bottom-left' : 'bottom-right',
    size: ['small', 'medium', 'large'].includes(data.size) ? data.size : DEFAULT_WHATSAPP.size,
    backgroundColor: data.backgroundColor || DEFAULT_WHATSAPP.backgroundColor,
  }
}

export function WhatsAppButton() {
  const { data } = useQuery({
    queryKey: ['settings', 'whatsapp', 'public'],
    queryFn: async () => {
      try {
        const res = await publicWhatsappApi.get()
        return res.data?.data ?? null
      } catch {
        return null
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const settings = React.useMemo(() => normalize(data), [data])

  if (!settings.enabled || !settings.phoneNumber) return null

  const href = buildWhatsappUrl(settings.phoneNumber, settings.prefilledMessage)
  const positionClass = settings.position === 'bottom-left' ? 'left-5' : 'right-5'
  const sizeClass = sizeClasses[settings.size] || sizeClasses.medium
  const iconSizeClass = iconSizes[settings.size] || iconSizes.medium

  const isCustom = !!settings.iconUrl

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={`fixed bottom-5 z-40 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${sizeClass} ${positionClass} ${isCustom ? 'flex items-center justify-center rounded-full shadow-lg' : ''}`}
      style={isCustom ? { backgroundColor: settings.backgroundColor } : undefined}
    >
      {isCustom ? (
        <img src={settings.iconUrl} alt="WhatsApp" className={`${iconSizeClass} rounded-full object-cover`} />
      ) : (
        <img src="/whatappNew.svg" alt="WhatsApp" className="h-full w-full object-contain" draggable={false} />
      )}
    </a>
  )
}
