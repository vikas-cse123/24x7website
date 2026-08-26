import { Router } from 'express'
import {
  eligibility,
  listByTrip,
  listRecent,
  create,
  myReviews,
} from '../controllers/review.controller.js'
import { validate } from '../utils/validate.js'
import {
  createReviewSchema,
  listReviewsByTripQuerySchema,
} from '../validators/review.validator.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

const router = Router()

// Public: approved reviews + summary for a trip (slug or id).
router.get('/recent', listRecent)
router.get('/trips/:slugOrId/reviews', validate(listReviewsByTripQuerySchema, 'query'), listByTrip)

// Eligibility is meaningful for logged-in users; guests get a stable response.
router.get(
  '/trips/:slugOrId/reviews/eligibility',
  optionalAuth,
  async (req, res) => {
    if (!req.userId) {
      return res.status(200).json({
        success: true,
        data: { eligible: false, reason: 'login-required' },
        message: 'Review eligibility',
      })
    }
    return eligibility(req, res, () => {})
  }
)

// Customer actions require auth.
router.post('/', requireAuth, validate(createReviewSchema), create)
router.get('/me', requireAuth, myReviews)

export default router
