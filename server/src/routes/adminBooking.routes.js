import { Router } from 'express'
import { list, getOne, setStatus, cancel } from '../controllers/adminBooking.controller.js'
import { validate } from '../utils/validate.js'
import {
  adminListBookingsQuerySchema,
  adminSetBookingStatusSchema,
} from '../validators/booking.validator.js'

const router = Router()

// Auth middleware is applied once at the parent admin router level.
router.get('/', validate(adminListBookingsQuerySchema, 'query'), list)
router.get('/:id', getOne)
// '/cancel' must be matched before '/:id' would... it is a POST on the same
// resource; distinct methods so no conflicts.
router.patch('/:id/status', validate(adminSetBookingStatusSchema), setStatus)
router.patch('/:id/cancel', cancel)

export default router
