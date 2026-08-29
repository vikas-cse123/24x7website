// Client-side mirror of the server's public-settings defaults. These are
// fallbacks only — the active values always come from the settings API. The UI
// must never break because a setting is missing.

export const DEFAULT_CONTACT = {
  phone: '',
  showPhoneInHeader: false,
}

export const DEFAULT_PROMOTIONAL_BANNER = {
  enabled: true,
  message: 'Early Bird Sale — Save on upcoming group trips',
  ctaText: 'Explore trips',
  ctaUrl: '/trips',
  shimmerEnabled: true,
  dismissible: true,
  backgroundColor: '',
  textColor: '',
}

// Banner CTA URLs: internal paths (/, ?…, #…) use router navigation; external
// http(s) links render as real anchors. Anything else is unsafe and ignored.
export function isSafeBannerUrl(url) {
  if (!url) return false
  return /^(https?:\/\/|\/|\?|#)/i.test(url) && !/^(javascript|data|vbscript):/i.test(url)
}

export function isExternalUrl(url) {
  return /^https?:\/\//i.test(url)
}