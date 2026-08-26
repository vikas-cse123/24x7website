import User, { toPublicUser } from '../models/User.js'
import { createOtp, verifyOtp } from './otp.service.js'
import { signToken } from '../utils/tokens.js'

export async function sendOtp({ countryCode, mobile }) {
  const { otp, expiresAt, ttlSeconds, devEchoOtp } = await createOtp({
    countryCode,
    mobile,
  })

  // No real SMS is sent in development. `otp` is returned only in dev.
  return {
    expiresAt,
    ttlSeconds,
    devEchoOtp,
    ...(devEchoOtp ? { devOtp: otp } : {}),
  }
}

export async function verifyOtpAndAuthenticate({ countryCode, mobile, otp }) {
  const result = await verifyOtp({ countryCode, mobile, otp })
  if (!result.valid) {
    const reason = result.reason || 'OTP_INVALID'
    return { success: false, reason }
  }

  // Find or create the user (auto signup on first OTP verification).
  let user = await User.findOne({ countryCode, mobile })
  if (!user) {
    user = await User.create({ countryCode, mobile, mobileVerified: true })
  } else {
    user.mobileVerified = true
  }
  user.lastLoginAt = new Date()
  await user.save()

  const token = signToken({ sub: user.id, role: user.role })

  return { success: true, token, user: toPublicUser(user) }
}

export async function getSessionUser(userId) {
  const user = await User.findById(userId)
  return user ? toPublicUser(user) : null
}
