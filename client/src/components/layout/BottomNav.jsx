import * as React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Play } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { publicWhatsappApi } from '@/services/settings'
import { DEFAULT_WHATSAPP } from '@/lib/settings'

function buildWhatsappUrl(phoneNumber, prefilledMessage) {
  const digits = String(phoneNumber || '').replace(/\D/g, '')
  if (!digits) return null
  const text = encodeURIComponent(prefilledMessage || '')
  return text ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/${digits}`
}

function normalizeWhatsapp(data) {
  if (!data || typeof data !== 'object') return DEFAULT_WHATSAPP
  return {
    enabled: typeof data.enabled === 'boolean' ? data.enabled : DEFAULT_WHATSAPP.enabled,
    phoneNumber: data.phoneNumber != null ? String(data.phoneNumber).replace(/\D/g, '') : DEFAULT_WHATSAPP.phoneNumber,
    prefilledMessage: typeof data.prefilledMessage === 'string' ? data.prefilledMessage : DEFAULT_WHATSAPP.prefilledMessage,
    iconUrl: data.iconUrl || null,
  }
}

const NAV_ITEMS = [
  { label: 'Home', icon: Home, to: '/' },
  { label: 'Search', icon: Search, to: '/trips?search=' },
  { label: 'TRIPS', to: '/trips', isText: true },
]

export function BottomNav({ onOpenPlay, isPlayOpen }) {
  const { pathname } = useLocation()
  const isActive = (to) => {
    if (to === '/') return pathname === '/'
    return pathname.startsWith(to)
  }

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

  const settings = React.useMemo(() => normalizeWhatsapp(data), [data])
  const whatsappHref = React.useMemo(
    () => (settings.enabled && settings.phoneNumber ? buildWhatsappUrl(settings.phoneNumber, settings.prefilledMessage) : null),
    [settings.enabled, settings.phoneNumber, settings.prefilledMessage]
  )

  if (isPlayOpen) return null

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-2 sm:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {NAV_ITEMS.map(({ label, icon: Icon, to, isText }) =>
        isText ? (
          <Link
            key={label}
            to={to}
            className={`flex flex-col items-center justify-center px-3 py-1 text-[11px] font-bold tracking-widest transition-colors ${isActive(to) ? 'text-primary' : 'text-slate-700'}`}
          >
            {label}
          </Link>
        ) : (
          <Link
            key={label}
            to={to}
            aria-label={label}
            className={`flex flex-col items-center justify-center p-2 transition-colors ${isActive(to) ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}
          >
            <Icon className={`h-5 w-5 ${isActive(to) ? 'fill-primary text-primary' : ''}`} />
            <span className="mt-1 text-[10px] font-medium leading-none">{label}</span>
          </Link>
        )
      )}
      {/* Play — opens full-screen vertical viewer on mobile, not navigation */}
      <button
        type="button"
        onClick={onOpenPlay}
        aria-label="Open travel videos"
        className="flex flex-col items-center justify-center p-2 text-slate-600 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Play className="h-5 w-5" />
        <span className="mt-1 text-[10px] font-medium leading-none" aria-hidden="true">
          {/* no label, keep spacing consistent */}
        </span>
      </button>
      {/* WhatsApp — sits inside bottom nav immediately to the right of Play (mobile only) */}
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="flex flex-col items-center justify-center p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {settings.iconUrl ? (
            <img
              src={settings.iconUrl}
              alt="WhatsApp"
              className="h-9 w-9 rounded-full object-cover shadow-sm"
              draggable={false}
            />
          ) : (
            <img
              src="/whatappNew.svg"
              alt="WhatsApp"
              className="h-9 w-9 object-contain"
              draggable={false}
            />
          )}
          <span className="mt-1 text-[10px] font-medium leading-none" aria-hidden="true" />
        </a>
      ) : null}
    </nav>
  )
}
