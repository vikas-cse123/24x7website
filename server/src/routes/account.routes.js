import { Router } from 'express'
import {
  getProfile,
  updateProfile,
  listBookings,
  getBookingByCode,
  listTravellers,
  createTraveller,
  updateTraveller,
  deleteTraveller,
} from '../controllers/account.controller.js'
import { validate } from '../utils/validate.js'
import {
  updateProfileSchema,
  accountBookingsQuerySchema,
  createTravellerSchema,
  updateTravellerSchema,
} from '../validators/account.validator.js'
import { requireAuth } from '../middleware/auth.js'
import wishlistRouter from './wishlist.routes.js'
import notificationRouter from './notification.routes.js'

const router = Router()

// The whole account area requires the existing JWT auth cookie.
router.use(requireAuth)

// profile
router.get('/profile', getProfile)
router.patch('/profile', validate(updateProfileSchema), updateProfile)

// bookings — delegates to the Phase 9 booking service (single source of truth)
router.get('/bookings', validate(accountBookingsQuerySchema, 'query'), listBookings)
// '/:bookingCode' is matched after the literal routes above.
router.get('/bookings/:bookingCode', getBookingByCode)

// saved travellers
router.get('/travellers', listTravellers)
router.post('/travellers', validate(createTravellerSchema), createTraveller)
router.patch('/travellers/:id', validate(updateTravellerSchema), updateTraveller)
router.delete('/travellers/:id', deleteTraveller)

router.use('/wishlist', wishlistRouter)
router.use('/notifications', notificationRouter)

export default router
