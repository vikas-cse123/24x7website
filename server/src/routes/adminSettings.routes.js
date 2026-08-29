import { Router } from 'express'
import { uploadSingle, handleMulterError } from '../middleware/upload.js'
import {
  getAdminSettings,
  getAdminBranding,
  uploadLogo,
  clearLogo,
  updateContact,
  updatePromotionalBanner,
} from '../controllers/settings.controller.js'
import { validate } from '../utils/validate.js'
import { updateContactSchema, updatePromotionalBannerSchema } from '../validators/settings.validator.js'

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

export default router