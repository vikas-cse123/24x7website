import { Router } from 'express'
import { create, list, getOne, getByCode, cancel } from '../controllers/booking.controller.js'
import { validate } from '../utils/validate.js'
import { createBookingSchema } from '../validators/booking.validator.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Booking requires an authenticated user (existing JWT + HTTP-only cookie).
router.use(requireAuth)

router.post('/', validate(createBookingSchema), create)
router.get('/', list)
// '/code/:code' must be matched before '/:id'.
router.get('/code/:code', getByCode)
router.get('/:id', getOne)
router.post('/:id/cancel', cancel)

export default router
