import * as settingsService from '../services/settings.service.js'
import * as imageStorage from '../services/imageStorage.service.js'
import { folderFor } from '../utils/imageFolders.js'

// GET /api/settings — public, no auth required. Aggregates logo, contact and
// promotional banner so the whole website can render its top area from one call.
export async function getPublicSettings(_req, res, next) {
  try {
    const data = await settingsService.getPublicSettings()
    res.status(200).json({ success: true, data, message: 'Public settings' })
  } catch (err) {
    next(err)
  }
}

// GET /api/settings/branding — public, no auth required.
export async function getPublicBranding(_req, res, next) {
  try {
    const data = await settingsService.getBrandingPublic()
    res.status(200).json({ success: true, data, message: 'Branding settings' })
  } catch (err) {
    next(err)
  }
}

// GET /api/admin/settings — admin-only aggregate (parent router guards).
export async function getAdminSettings(_req, res, next) {
  try {
    const data = await settingsService.getAdminSettings()
    res.status(200).json({ success: true, data, message: 'Settings' })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/admin/settings/contact — admin-only.
export async function updateContact(req, res, next) {
  try {
    const data = await settingsService.updateContact(req.body)
    res.status(200).json({ success: true, data, message: 'Contact settings updated' })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/admin/settings/promotional-banner — admin-only.
export async function updatePromotionalBanner(req, res, next) {
  try {
    const data = await settingsService.updatePromotionalBanner(req.body)
    res.status(200).json({ success: true, data, message: 'Promotional banner updated' })
  } catch (err) {
    next(err)
  }
}

// GET /api/admin/settings/branding — admin-only (parent router guards).
export async function getAdminBranding(_req, res, next) {
  try {
    const data = await settingsService.getBrandingAdmin()
    res.status(200).json({ success: true, data, message: 'Branding settings' })
  } catch (err) {
    next(err)
  }
}

// POST /api/admin/settings/branding/logo — admin-only. Multipart field `image`.
// Uploads through the canonical imageStorage (AWS S3) into `brand-media`,
// then stores only the returned metadata. When S3 is not configured the
// upload throws a clean 503 and nothing is persisted.
export async function uploadLogo(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No logo image provided' })
    }
    if (!settingsService.isAllowedLogoMime(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Only JPG, JPEG, PNG or WebP images are supported',
      })
    }
    const alt = String(req.body?.alt || '').trim().slice(0, 200) || settingsService.BRAND_NAME
    const meta = await imageStorage.upload(req.file.buffer, {
      folder: folderFor('brand-media'),
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    })
    const data = await settingsService.setBrandingLogo({
      url: meta.url,
      publicId: meta.publicId,
      alt,
    })
    res.status(200).json({ success: true, data, message: 'Logo updated' })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/admin/settings/branding/logo — admin-only. Resets branding to the
// default /logo.jpg. Non-destructive: the stored S3 asset is not deleted and
// client/public/logo.jpg is untouched.
export async function clearLogo(_req, res, next) {
  try {
    const data = await settingsService.clearBrandingLogo()
    res.status(200).json({ success: true, data, message: 'Branding reset to default' })
  } catch (err) {
    next(err)
  }
}