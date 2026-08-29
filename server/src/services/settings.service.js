import AppSetting from '../models/AppSetting.js'
import { isCloudinaryConfigured } from '../config/cloudinary.js'

export const BRANDING_KEY = 'branding'
export const CONTACT_KEY = 'contact'
export const PROMOTIONAL_BANNER_KEY = 'promotionalBanner'

export const BRAND_NAME = '24x7Chhutti'
// client/public/logo.jpg — the official default/fallback logo. Never modified,
// never deleted. The whole branding system falls back to it automatically.
export const DEFAULT_LOGO_URL = '/logo.jpg'
export const DEFAULT_LOGO_ALT = BRAND_NAME

// No real phone number is configured anywhere in the project, so the default
// is intentionally empty and hidden. The admin adds a number + enables the
// header toggle. No phone number is ever invented.
export const DEFAULT_CONTACT = {
  phone: '',
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
// Cloudinary configuration status so the admin UI can warn before uploading.
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
  return { logo, cloudinaryConfigured: isCloudinaryConfigured }
}

// Persist the uploaded logo metadata (never the binary) under the branding
// setting. Old Cloudinary assets are intentionally NOT deleted (non-destructive).
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
  return {
    phone:
      typeof data.phone === 'string' ? data.phone.trim().replace(/\s+/g, ' ').slice(0, 30) : '',
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
  const take = (value, fallback, max) => {
    const v = typeof value === 'string' ? value.trim() : ''
    return v ? v.slice(0, max) : fallback
  }
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

// --- aggregate ----------------------------------------------------------------

// Everything the public website needs in one call (no auth required).
export async function getPublicSettings() {
  const [branding, contact, promotionalBanner] = await Promise.all([
    getBrandingPublic(),
    getContactPublic(),
    getPromotionalBannerPublic(),
  ])
  return { logo: branding.logo, contact, promotionalBanner }
}

// Full admin settings bundle (admin-only; parent router guards).
export async function getAdminSettings() {
  const [branding, contact, promotionalBanner] = await Promise.all([
    getBrandingAdmin(),
    getContactPublic(),
    getPromotionalBannerPublic(),
  ])
  return { branding, contact, promotionalBanner }
}