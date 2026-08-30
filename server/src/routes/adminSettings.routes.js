import { Router } from 'express'
import { uploadSingle, handleMulterError } from '../middleware/upload.js'
import {
  getAdminSettings,
  getAdminBranding,
  uploadLogo,
  clearLogo,
  updateContact,
  updatePromotionalBanner,
  getAdminWhatsapp,
  updateWhatsapp,
  uploadWhatsappIcon,
  clearWhatsappIcon,
} from '../controllers/settings.controller.js'
import { validate } from '../utils/validate.js'
import {
  updateContactSchema,
  updatePromotionalBannerSchema,
  updateWhatsappSchema,
} from '../validators/settings.validator.js'

const router = Router()

// Auth middleware is applied once at the parent admin router level
// (requireAuth + requireRole). These routes must never be reachable by
// unauthenticated or non-admin callers.

router.get('/', getAdminSettings)
router.get('/branding', getAdminBranding)
router.post('/branding/logo', (req, res, next) =>
  uploadSingle(req, res, (err) => (err ? handleMulterError(err, req, res, next) : uploadLogo(req, res, next)))
)
router.delete('/branding/logo', clearLogo)
router.patch('/contact', validate(updateContactSchema), updateContact)
router.patch('/promotional-banner', validate(updatePromotionalBannerSchema), updatePromotionalBanner)
router.get('/whatsapp', getAdminWhatsapp)
router.patch('/whatsapp', validate(updateWhatsappSchema), updateWhatsapp)
router.post('/whatsapp/icon', (req, res, next) =>
  uploadSingle(req, res, (err) => (err ? handleMulterError(err, req, res, next) : uploadWhatsappIcon(req, res, next)))
)
router.delete('/whatsapp/icon', clearWhatsappIcon)

export default router