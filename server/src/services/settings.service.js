import AppSetting from '../models/AppSetting.js'
import { isS3Configured } from '../config/s3.js'

export const BRANDING_KEY = 'branding'
export const CONTACT_KEY = 'contact'
export const PROMOTIONAL_BANNER_KEY = 'promotionalBanner'
export const WHATSAPP_KEY = 'whatsapp'

export const BRAND_NAME = '24x7Chhutti'
// client/public/logo.jpg — the official default/fallback logo. Never modified,
// never deleted. The whole branding system falls back to it automatically.
export const DEFAULT_LOGO_URL = '/logo.jpg'
export const DEFAULT_LOGO_ALT = BRAND_NAME

// No real phone number is configured anywhere in the project, so the default
// is intentionally empty and hidden. The admin adds a number + enables the
// header toggle. No phone number is ever invented. `showCountryCode` controls
// whether a +91 prefix is shown in the header; the stored number never
// contains the prefix (it is added/removed only when displaying).
export const DEFAULT_CONTACT = {
  phone: '',
  showCountryCode: true,
  showPhoneInHeader: false,
}

// Promotional banner defaults — an empty database must never break the site.
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

// WhatsApp floating button defaults — safe fallbacks only, never override DB values.
export const DEFAULT_WHATSAPP = {
  enabled: true,
  phoneNumber: '919310660016',
  prefilledMessage: 'Hey! Capture A Trip I am interested in your trips',
  icon: null, // { url, publicId } when custom, null → default icon
  position: 'bottom-right', // bottom-right | bottom-left
  size: 'medium', // small | medium | large
  backgroundColor: '#25D366',
}

// Uploads are restricted to raster formats; SVG stays disabled (no sanitizer).
const ALLOWED_LOGO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function isAllowedLogoMime(mime) {
  return ALLOWED_LOGO_MIME_TYPES.includes(mime)
}

async function getSettingData(key) {
  const doc = await AppSetting.findOne({ key }).lean()
  return doc?.data && typeof doc.data === 'object' ? doc.data : {}
}

function normalizePublicLogo(logo) {
  return logo?.url
    ? { url: logo.url, alt: logo.alt || DEFAULT_LOGO_ALT }
    : { url: DEFAULT_LOGO_URL, alt: DEFAULT_LOGO_ALT }
}

// Public branding — never requires authentication. Missing/empty/broken
// branding falls back to the default /logo.jpg.
export async function getBrandingPublic() {
  const data = await getSettingData(BRANDING_KEY)
  return { logo: normalizePublicLogo(data.logo) }
}

// Admin branding — includes metadata (publicId, updatedAt, isCustom) and the
// storage configuration status so the admin UI can warn before uploading.
export async function getBrandingAdmin() {
  const data = await getSettingData(BRANDING_KEY)
  const logo = data.logo?.url
    ? {
        url: data.logo.url,
        alt: data.logo.alt || DEFAULT_LOGO_ALT,
        publicId: data.logo.publicId || '',
        updatedAt: data.logo.updatedAt || null,
        isCustom: true,
      }
    : {
        url: DEFAULT_LOGO_URL,
        alt: DEFAULT_LOGO_ALT,
        publicId: '',
        updatedAt: null,
        isCustom: false,
      }
  return { logo, storageConfigured: isS3Configured }
}

// Persist the uploaded logo metadata (never the binary) under the branding
// setting. Old stored assets are intentionally NOT deleted (non-destructive).
export async function setBrandingLogo({ url, publicId = '', alt = DEFAULT_LOGO_ALT }) {
  await AppSetting.updateOne(
    { key: BRANDING_KEY },
    {
      $set: {
        data: {
          logo: {
            url,
            publicId: publicId || '',
            alt: alt || DEFAULT_LOGO_ALT,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    },
    { upsert: true }
  )
  return getBrandingAdmin()
}

// Remove the custom branding setting entirely. The public site then falls back
// to /logo.jpg automatically. Does not touch client/public/logo.jpg.
export async function clearBrandingLogo() {
  await AppSetting.deleteOne({ key: BRANDING_KEY })
  return getBrandingAdmin()
}

// --- contact -----------------------------------------------------------------

function normalizeContact(data = {}) {
  // Store only the local number: an explicit "+91 " prefix typed by the admin
  // is stripped so the stored value never contains the country code. A number
  // that merely STARTS with 91 (e.g. 9167834595) is kept intact — only the
  // "+"-prefixed form is treated as a country code. The header re-adds (+91)
  // purely for display when `showCountryCode` is enabled.
  const phone =
    typeof data.phone === 'string' ? data.phone.trim().replace(/\s+/g, ' ').slice(0, 30) : ''
  const phoneWithoutCode = phone.replace(/^\+91[\s-]*/, '')
  return {
    phone: phoneWithoutCode,
    showCountryCode:
      typeof data.showCountryCode === 'boolean'
        ? data.showCountryCode
        : DEFAULT_CONTACT.showCountryCode,
    showPhoneInHeader:
      typeof data.showPhoneInHeader === 'boolean'
        ? data.showPhoneInHeader
        : DEFAULT_CONTACT.showPhoneInHeader,
  }
}

export async function getContactPublic() {
  return normalizeContact(await getSettingData(CONTACT_KEY))
}

export async function updateContact(input = {}) {
  const next = normalizeContact(input)
  await AppSetting.updateOne({ key: CONTACT_KEY }, { $set: { data: next } }, { upsert: true })
  return next
}

// --- promotional banner -------------------------------------------------------

function normalizePromotionalBanner(data = {}) {
  // An explicitly saved empty string must persist (admin cleared the field).
  // Defaults apply only when the field is absent entirely (never set).
  const take = (value, fallback, max) =>
    typeof value === 'string' ? value.trim().slice(0, max) : fallback
  return {
    enabled: typeof data.enabled === 'boolean' ? data.enabled : DEFAULT_PROMOTIONAL_BANNER.enabled,
    message: take(data.message, DEFAULT_PROMOTIONAL_BANNER.message, 300),
    ctaText: take(data.ctaText, DEFAULT_PROMOTIONAL_BANNER.ctaText, 60),
    ctaUrl: take(data.ctaUrl, DEFAULT_PROMOTIONAL_BANNER.ctaUrl, 300),
    shimmerEnabled:
      typeof data.shimmerEnabled === 'boolean'
        ? data.shimmerEnabled
        : DEFAULT_PROMOTIONAL_BANNER.shimmerEnabled,
    dismissible:
      typeof data.dismissible === 'boolean'
        ? data.dismissible
        : DEFAULT_PROMOTIONAL_BANNER.dismissible,
    backgroundColor:
      typeof data.backgroundColor === 'string' ? data.backgroundColor.trim().slice(0, 50) : '',
    textColor: typeof data.textColor === 'string' ? data.textColor.trim().slice(0, 50) : '',
  }
}

export async function getPromotionalBannerPublic() {
  return normalizePromotionalBanner(await getSettingData(PROMOTIONAL_BANNER_KEY))
}

export async function updatePromotionalBanner(input = {}) {
  const next = normalizePromotionalBanner(input)
  await AppSetting.updateOne(
    { key: PROMOTIONAL_BANNER_KEY },
    { $set: { data: next } },
    { upsert: true }
  )
  return next
}

// --- whatsapp -------------------------------------------------------------------
// Normalize phone: strip non-digits, allow +91 / 91 prefix, store as digits only (e.g. 919310660016)
function normalizePhone(value) {
  const raw = String(value || '').trim()
  const digits = raw.replace(/\D/g, '')
  return digits.slice(0, 15)
}

const WHATSAPP_POSITIONS = ['bottom-right', 'bottom-left']
const WHATSAPP_SIZES = ['small', 'medium', 'large']
const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/

function normalizeWhatsapp(data = {}) {
  // Same rule as the banner: an explicitly saved empty string persists;
  // defaults apply only when the field was never set.
  const rawPhone = typeof data.phoneNumber === 'string' ? data.phoneNumber : typeof data.phone === 'string' ? data.phone : DEFAULT_WHATSAPP.phoneNumber
  const phoneNumber = typeof data.phoneNumber === 'string' || typeof data.phone === 'string' ? normalizePhone(rawPhone) : DEFAULT_WHATSAPP.phoneNumber
  const prefilledMessage =
    typeof data.prefilledMessage === 'string'
      ? data.prefilledMessage.trim().slice(0, 500)
      : DEFAULT_WHATSAPP.prefilledMessage
  const position = WHATSAPP_POSITIONS.includes(data.position) ? data.position : DEFAULT_WHATSAPP.position
  const size = WHATSAPP_SIZES.includes(data.size) ? data.size : DEFAULT_WHATSAPP.size
  const backgroundColor =
    typeof data.backgroundColor === 'string' && HEX_COLOR.test(data.backgroundColor.trim())
      ? data.backgroundColor.trim()
      : DEFAULT_WHATSAPP.backgroundColor

  // Icon is stored as {url, publicId} or null
  let icon = null
  if (data.icon && typeof data.icon === 'object' && data.icon.url) {
    icon = { url: String(data.icon.url).trim().slice(0, 500), publicId: String(data.icon.publicId || '').trim().slice(0, 300) }
  } else if (typeof data.iconUrl === 'string' && data.iconUrl.trim()) {
    icon = { url: data.iconUrl.trim().slice(0, 500), publicId: String(data.iconPublicId || '').trim().slice(0, 300) }
  } else if (data.iconUrl === null || data.icon === null) {
    icon = null
  } else {
    // Preserve existing icon if not explicitly cleared - caller merges
    icon = undefined
  }

  const out = {
    enabled: typeof data.enabled === 'boolean' ? data.enabled : DEFAULT_WHATSAPP.enabled,
    phoneNumber,
    prefilledMessage,
    position,
    size,
    backgroundColor,
  }
  if (icon !== undefined) out.icon = icon
  return out
}

export async function getWhatsappPublic() {
  const data = await getSettingData(WHATSAPP_KEY)
  const normalized = normalizeWhatsapp({ ...DEFAULT_WHATSAPP, ...data })
  // Public exposure: only needed fields, no internal ids
  return {
    enabled: normalized.enabled,
    phoneNumber: normalized.phoneNumber,
    prefilledMessage: normalized.prefilledMessage,
    iconUrl: normalized.icon?.url || null,
    position: normalized.position,
    size: normalized.size,
    backgroundColor: normalized.backgroundColor,
  }
}

export async function getWhatsappAdmin() {
  const data = await getSettingData(WHATSAPP_KEY)
  const normalized = normalizeWhatsapp({ ...DEFAULT_WHATSAPP, ...data, icon: data.icon !== undefined ? data.icon : DEFAULT_WHATSAPP.icon })
  const raw = await getSettingData(WHATSAPP_KEY)
  return {
    enabled: normalized.enabled,
    phoneNumber: normalized.phoneNumber,
    prefilledMessage: normalized.prefilledMessage,
    icon: normalized.icon || null,
    iconUrl: normalized.icon?.url || null,
    iconPublicId: normalized.icon?.publicId || null,
    position: normalized.position,
    size: normalized.size,
    backgroundColor: normalized.backgroundColor,
    // For admin UI to know if S3 is available for icon upload
    storageConfigured: isS3Configured,
    raw,
  }
}

export async function updateWhatsapp(input = {}) {
  const existing = await getSettingData(WHATSAPP_KEY)
  const merged = { ...DEFAULT_WHATSAPP, ...existing, ...input }
  // If icon not supplied, keep existing
  if (input.icon === undefined && input.iconUrl === undefined && existing.icon !== undefined) {
    merged.icon = existing.icon
  }
  const next = normalizeWhatsapp(merged)
  // Ensure icon is preserved as object
  if (next.icon === undefined) next.icon = existing.icon || null
  await AppSetting.updateOne({ key: WHATSAPP_KEY }, { $set: { data: next } }, { upsert: true })
  return getWhatsappAdmin()
}

export async function setWhatsappIcon({ url, publicId = '' }) {
  const existing = await getSettingData(WHATSAPP_KEY)
  const base = normalizeWhatsapp({ ...DEFAULT_WHATSAPP, ...existing })
  base.icon = { url, publicId }
  await AppSetting.updateOne({ key: WHATSAPP_KEY }, { $set: { data: base } }, { upsert: true })
  return getWhatsappAdmin()
}

export async function clearWhatsappIcon() {
  const existing = await getSettingData(WHATSAPP_KEY)
  const base = normalizeWhatsapp({ ...DEFAULT_WHATSAPP, ...existing })
  base.icon = null
  await AppSetting.updateOne({ key: WHATSAPP_KEY }, { $set: { data: base } }, { upsert: true })
  return getWhatsappAdmin()
}

// --- aggregate ----------------------------------------------------------------

// Everything the public website needs in one call (no auth required).
export async function getPublicSettings() {
  const [branding, contact, promotionalBanner, whatsapp] = await Promise.all([
    getBrandingPublic(),
    getContactPublic(),
    getPromotionalBannerPublic(),
    getWhatsappPublic(),
  ])
  return { logo: branding.logo, contact, promotionalBanner, whatsapp }
}

// Full admin settings bundle (admin-only; parent router guards).
export async function getAdminSettings() {
  const [branding, contact, promotionalBanner, whatsapp] = await Promise.all([
    getBrandingAdmin(),
    getContactPublic(),
    getPromotionalBannerPublic(),
    getWhatsappAdmin(),
  ])
  return { branding, contact, promotionalBanner, whatsapp }
}