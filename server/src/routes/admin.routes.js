import { Router } from 'express'
import { dashboard } from '../controllers/admin.controller.js'
import adminDestinationRouter from './adminDestination.routes.js'
import adminTripRouter from './adminTrip.routes.js'
import adminTripBatchRouter from './adminTripBatch.routes.js'
import adminBookingRouter from './adminBooking.routes.js'
import adminReviewRouter from './adminReview.routes.js'
import adminBlogRouter from './adminBlog.routes.js'
import adminFaqRouter from './adminFaq.routes.js'
import uploadRouter from './upload.routes.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { ADMIN_ROLES } from '../utils/roles.js'

const router = Router()

// Every /api/admin/* route requires an authenticated user with an allowed role.
// Frontend route protection is UX only; this is the real security boundary.
router.use(requireAuth, requireRole(...ADMIN_ROLES))

router.get('/dashboard', dashboard)
router.use('/destinations', adminDestinationRouter)
router.use('/trips', adminTripRouter)
router.use('/trip-batches', adminTripBatchRouter)
router.use('/bookings', adminBookingRouter)
router.use('/reviews', adminReviewRouter)
router.use('/blogs', adminBlogRouter)
router.use('/faqs', adminFaqRouter)
router.use('/upload', uploadRouter)

export default router