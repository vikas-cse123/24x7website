import { Router } from 'express'
import { adminList, adminModerate, adminRemove } from '../controllers/review.controller.js'
import { validate } from '../utils/validate.js'
import {
  adminListReviewsQuerySchema,
  adminModerateReviewSchema,
} from '../validators/review.validator.js'

const router = Router()

// Auth middleware is applied once at the parent admin router level.
router.get('/', validate(adminListReviewsQuerySchema, 'query'), adminList)
router.patch('/:id/status', validate(adminModerateReviewSchema), adminModerate)
router.delete('/:id', adminRemove)

export default router
