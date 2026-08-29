import { Router } from 'express'
import healthRouter from './health.routes.js'
import authRouter from './auth.routes.js'
import adminRouter from './admin.routes.js'
import destinationRouter from './destination.routes.js'
import tripRouter from './trip.routes.js'
import bookingRouter from './booking.routes.js'
import accountRouter from './account.routes.js'
import reviewRouter from './review.routes.js'
import blogRouter from './blog.routes.js'
import faqRouter from './faq.routes.js'
import tripMediaRouter from './tripMedia.routes.js'
import enquiryRouter from './enquiry.routes.js'
import settingsRouter from './settings.routes.js'

const router = Router()

router.use('/health', healthRouter)
router.use('/auth', authRouter)
router.use('/admin', adminRouter)
router.use('/destinations', destinationRouter)
router.use('/trips', tripRouter)
router.use('/bookings', bookingRouter)
router.use('/account', accountRouter)
router.use('/reviews', reviewRouter)
router.use('/blogs', blogRouter)
router.use('/faqs', faqRouter)
router.use('/enquiries', enquiryRouter)
router.use('/settings', settingsRouter)
router.use('/', tripMediaRouter)

export default router