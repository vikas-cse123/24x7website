import * as authService from '../services/auth.service.js'
import { setAuthCookie, clearAuthCookie } from '../middleware/auth.js'

export async function sendOtp(req, res, next) {
  try {
    const { countryCode, mobile } = req.body
    const data = await authService.sendOtp({ countryCode, mobile })
    res.status(200).json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const { countryCode, mobile, otp } = req.body
    const result = await authService.verifyOtpAndAuthenticate({
      countryCode,
      mobile,
      otp,
    })

    if (!result.success) {
      const message = {
        OTP_EXPIRED: 'OTP has expired. Please request a new one.',
        OTP_INVALID: 'Invalid OTP. Please try again.',
        NO_OTP_REQUESTED: 'No OTP was requested for this number. Please request one first.',
      }[result.reason] || 'Verification failed.'

      return res.status(400).json({ success: false, message })
    }

    setAuthCookie(res, result.token)
    res.status(200).json({ success: true, data: { user: result.user } })
  } catch (err) {
    next(err)
  }
}

export async function me(req, res) {
  const user = await authService.getSessionUser(req.userId)
  if (!user) {
    return res.status(401).json({ success: false, message: 'Account not found' })
  }
  res.status(200).json({ success: true, data: { user } })
}

export async function logout(_req, res) {
  clearAuthCookie(res)
  res.status(200).json({ success: true, message: 'Logged out' })
}
