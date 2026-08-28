import { Router } from 'express'
import { create } from '../controllers/enquiry.controller.js'
import { validate } from '../utils/validate.js'
import { createEnquirySchema } from '../validators/enquiry.validator.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

// Public lead submission — visitors may be logged out. `optionalAuth` attaches
// the userId when a valid session exists (for attribution) but never blocks.
router.post('/', optionalAuth, validate(createEnquirySchema), create)

export default router