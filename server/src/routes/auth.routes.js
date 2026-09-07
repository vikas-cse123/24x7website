import { Router } from 'express'
import {
  sendOtp,
  verifyOtp,
  signup,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  resendPasswordReset,
  me,
  logout,
} from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../utils/validate.js'
import {
  sendOtpSchema,
  verifyOtpSchema,
  signupSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js'

const router = Router()

// Legacy phone OTP (kept for backward compatibility, not used by new UI)
router.post('/send-otp', validate(sendOtpSchema), sendOtp)
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp)

// New email/password flow
router.post('/signup', validate(signupSchema), signup)
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail)
router.post('/resend-verification', validate(resendVerificationSchema), resendVerification)
router.post('/login', validate(loginSchema), login)
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword)
router.post('/verify-reset-otp', validate(verifyResetOtpSchema), verifyResetOtp)
router.post('/reset-password', validate(resetPasswordSchema), resetPassword)
router.post('/resend-password-reset', validate(resendVerificationSchema), resendPasswordReset)

router.get('/me', requireAuth, me)
router.post('/logout', logout)

export default router
