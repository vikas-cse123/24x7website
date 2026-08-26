import { Router } from 'express'
import { sendOtp, verifyOtp, me, logout } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../utils/validate.js'
import { sendOtpSchema, verifyOtpSchema } from '../validators/auth.validator.js'

const router = Router()

router.post('/send-otp', validate(sendOtpSchema), sendOtp)
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp)
router.get('/me', requireAuth, me)
router.post('/logout', logout)

export default router
