import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { ADMIN_ROLES } from '../utils/roles.js'
import { validate } from '../utils/validate.js'
import { createTripMediaSchema, updateTripMediaSchema, listTripMediaQuerySchema, adminListTripMediaQuerySchema } from '../validators/tripMedia.validator.js'
import * as ctrl from '../controllers/tripMedia.controller.js'

const router = Router()

// public: list media for a trip (published only)
router.get('/trips/:tripId/media', validate(listTripMediaQuerySchema,'query'), ctrl.listPublic)

// admin
router.get('/admin/media', requireAuth, requireRole(...ADMIN_ROLES), validate(adminListTripMediaQuerySchema,'query'), ctrl.listAdmin)
router.post('/admin/media', requireAuth, requireRole(...ADMIN_ROLES), validate(createTripMediaSchema), ctrl.create)
router.patch('/admin/media/:id', requireAuth, requireRole(...ADMIN_ROLES), validate(updateTripMediaSchema), ctrl.update)
router.delete('/admin/media/:id', requireAuth, requireRole(...ADMIN_ROLES), ctrl.remove)
router.patch('/admin/media/:id/publish', requireAuth, requireRole(...ADMIN_ROLES), ctrl.setPublished)
router.post('/admin/media/reorder', requireAuth, requireRole(...ADMIN_ROLES), ctrl.reorder)

export default router
