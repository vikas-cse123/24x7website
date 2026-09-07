import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import User, { toPublicUser } from '../models/User.js'
import { createOtp, verifyOtp } from './otp.service.js'
import { createEmailOtp, verifyEmailOtp, clearEmailOtp } from './emailOtp.service.js'
import { sendVerificationOtp, sendPasswordResetOtp } from './email.service.js'
import { signToken } from '../utils/tokens.js'
import { ROLES } from '../utils/roles.js'
import config from '../config/index.js'

// DEV-ONLY: any +91 number matching this becomes an admin on OTP login, so a
// demo admin can be reached without manual DB seeding. The demo OTP is the
// standard mock value `123456` (see otp.service.js). Never promote real users
// this way — remove in production.
const DEMO_ADMIN_MOBILE = '9876543210'

function isDemoAdmin({ countryCode, mobile }) {
  return countryCode === '+91' && mobile === DEMO_ADMIN_MOBILE
}

export async function sendOtp({ countryCode, mobile }) {
  const { otp, expiresAt, ttlSeconds, devEchoOtp } = await createOtp({
    countryCode,
    mobile,
  })
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
  const role = isDemoAdmin({ countryCode, mobile }) ? ROLES.ADMIN : undefined
  let user = await User.findOne({ countryCode, mobile })
  if (!user) {
    user = await User.create({ countryCode, mobile, mobileVerified: true, role })
  } else {
    user.mobileVerified = true
    if (isDemoAdmin({ countryCode, mobile })) user.role = ROLES.ADMIN
  }
  user.lastLoginAt = new Date()
  await user.save()
  const token = signToken({ sub: user.id, role: user.role })
  return { success: true, token, user: toPublicUser(user) }
}

export async function signup({ name, email, phone, countryCode = '+91', password }) {
  const normalizedEmail = String(email).trim().toLowerCase()
  const existing = await User.findOne({ email: normalizedEmail })
  if (existing) {
    const err = new Error('An account with this email already exists. Please log in.')
    err.status = 409
    throw err
  }
  // Validate phone
  const digits = String(phone).replace(/\D/g, '')
  if (!digits || digits.length < 6) {
    const err = new Error('Phone number is required')
    err.status = 400
    throw err
  }
  if (countryCode === '+91' && !/^[6-9]\d{9}$/.test(digits)) {
    const err = new Error('Enter a valid 10-digit Indian mobile number')
    err.status = 400
    throw err
  }
  const passwordHash = await bcrypt.hash(String(password), 10)
  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    mobile: digits,
    countryCode: countryCode || '+91',
    passwordHash,
    emailVerified: false,
    mobileVerified: false,
    isActive: true,
  })
  // Generate and send email OTP
  const { otp, expiresAt } = await createEmailOtp(normalizedEmail, 'emailVerification')
  try {
    await sendVerificationOtp(normalizedEmail, otp, String(name).trim())
  } catch (e) {
    // If email fails, delete the created OTP and surface error
    await clearEmailOtp(normalizedEmail, 'emailVerification').catch(() => {})
    // Optionally delete the user? Keep user but allow resend; don't delete
    throw e
  }
  return { user: toPublicUser(user), expiresAt }
}

export async function verifyEmail({ email, otp }) {
  const normalizedEmail = String(email).trim().toLowerCase()
  const result = await verifyEmailOtp(normalizedEmail, otp, 'emailVerification')
  if (!result.valid) {
    const err = new Error(
      result.reason === 'OTP_EXPIRED'
        ? 'OTP has expired. Please request a new one.'
        : result.reason === 'OTP_ATTEMPTS_EXCEEDED'
        ? 'Too many attempts. Please request a new OTP.'
        : result.reason === 'NO_OTP_REQUESTED'
        ? 'No OTP was requested for this email. Please request one first.'
        : 'Invalid OTP. Please try again.'
    )
    err.status = 400
    err.reason = result.reason
    throw err
  }
  const user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    const err = new Error('Account not found')
    err.status = 404
    throw err
  }
  user.emailVerified = true
  user.mobileVerified = true
  await user.save()
  const token = signToken({ sub: user.id, role: user.role })
  // Update last login
  user.lastLoginAt = new Date()
  await user.save().catch(() => {})
  return { token, user: toPublicUser(user) }
}

export async function resendVerificationOtp({ email }) {
  const normalizedEmail = String(email).trim().toLowerCase()
  const user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    const err = new Error('Account not found')
    err.status = 404
    throw err
  }
  if (user.emailVerified) {
    const err = new Error('Email is already verified')
    err.status = 400
    throw err
  }
  const { otp, expiresAt } = await createEmailOtp(normalizedEmail, 'emailVerification')
  await sendVerificationOtp(normalizedEmail, otp, user.name || '')
  return { expiresAt }
}

export async function login({ email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase()
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash')
  if (!user || !user.passwordHash) {
    const err = new Error('Invalid email or password.')
    err.status = 401
    throw err
  }
  if (!user.isActive) {
    const err = new Error('Account is disabled')
    err.status = 403
    throw err
  }
  const match = await bcrypt.compare(String(password), user.passwordHash)
  if (!match) {
    const err = new Error('Invalid email or password.')
    err.status = 401
    throw err
  }
  if (!user.emailVerified) {
    const err = new Error('Please verify your email before logging in.')
    err.status = 403
    err.code = 'EMAIL_NOT_VERIFIED'
    throw err
  }
  user.lastLoginAt = new Date()
  await user.save()
  const token = signToken({ sub: user.id, role: user.role })
  // Need to fetch without passwordHash for public user
  const publicUser = toPublicUser(user)
  return { token, user: publicUser }
}

export async function forgotPassword({ email }) {
  const normalizedEmail = String(email).trim().toLowerCase()
  const user = await User.findOne({ email: normalizedEmail })
  // To prevent enumeration, always return success even if user not found, but only send email if exists
  if (user) {
    try {
      const { otp } = await createEmailOtp(normalizedEmail, 'passwordReset')
      await sendPasswordResetOtp(normalizedEmail, otp, user.name || '')
    } catch (e) {
      if (e.status === 429) throw e
      // For other errors, still throw to indicate service issue, but for "user not found" case we would have already returned
      throw e
    }
  }
  return { message: "If an account exists for this email, we've sent a verification code." }
}

export async function verifyResetOtp({ email, otp }) {
  const normalizedEmail = String(email).trim().toLowerCase()
  const result = await verifyEmailOtp(normalizedEmail, otp, 'passwordReset')
  if (!result.valid) {
    const err = new Error(
      result.reason === 'OTP_EXPIRED'
        ? 'OTP has expired. Please request a new one.'
        : result.reason === 'OTP_ATTEMPTS_EXCEEDED'
        ? 'Too many attempts. Please request a new OTP.'
        : result.reason === 'NO_OTP_REQUESTED'
        ? 'No OTP was requested for this email. Please request one first.'
        : 'Invalid or expired OTP.'
    )
    err.status = 400
    err.reason = result.reason
    throw err
  }
  // OTP is valid and already deleted (one-time). Create a short-lived verified marker
  // For password reset, we need to allow the next step (reset password) to proceed.
  // We can create a temporary OTP with type passwordResetVerified or just rely on the fact that verification succeeded
  // and the frontend will proceed to reset. The reset endpoint should verify that a recent successful verification happened.
  // Simplest: create a new OTP record with a special marker that expires quickly, or just don't delete and treat verified as passed.
  // Our verifyEmailOtp already deleted the OTP, so we need a way to mark that email has been verified for reset.
  // We will create a new short-lived "passwordResetVerified" token or just store in Otp with a different type?
  // For simplicity, create a new Otp with a dummy hash that indicates verified, or use a separate collection.
  // Instead, we will create a temporary "resetVerified" flag in Otp collection with a short expiry (10 minutes).
  // Generate a random token and store it.
  const verifiedToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
  const Otp = (await import('../models/Otp.js')).default
  // Clear any existing verified markers
  await Otp.deleteMany({ email: normalizedEmail, type: 'passwordResetVerified' })
  await Otp.create({ email: normalizedEmail, otp: verifiedToken, type: 'passwordResetVerified', expiresAt, attempts: 0 })
  return { verified: true }
}

export async function resetPassword({ email, newPassword, confirmPassword }) {
  const normalizedEmail = String(email).trim().toLowerCase()
  if (!newPassword || String(newPassword).length < 6) {
    const err = new Error('Password must be at least 6 characters')
    err.status = 400
    throw err
  }
  if (String(newPassword) !== String(confirmPassword)) {
    const err = new Error('Passwords do not match')
    err.status = 400
    throw err
  }
  // Check that email has a verified reset marker
  const Otp = (await import('../models/Otp.js')).default
  const verified = await Otp.findOne({ email: normalizedEmail, type: 'passwordResetVerified' }).sort({ createdAt: -1 })
  if (!verified || new Date() > verified.expiresAt) {
    const err = new Error('Please verify your email with OTP before resetting password')
    err.status = 400
    throw err
  }
  const user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    const err = new Error('Account not found')
    err.status = 404
    throw err
  }
  const passwordHash = await bcrypt.hash(String(newPassword), 10)
  user.passwordHash = passwordHash
  await user.save()
  // Invalidate the verified marker and any remaining reset OTPs
  await Otp.deleteMany({ email: normalizedEmail, type: { $in: ['passwordReset', 'passwordResetVerified'] } })
  return { message: 'Password reset successfully' }
}

export async function resendPasswordResetOtp({ email }) {
  const normalizedEmail = String(email).trim().toLowerCase()
  const user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    // Still return generic message to prevent enumeration, but don't send
    return { message: "If an account exists for this email, we've sent a verification code." }
  }
  const { otp } = await createEmailOtp(normalizedEmail, 'passwordReset')
  await sendPasswordResetOtp(normalizedEmail, otp, user.name || '')
  return { message: "If an account exists for this email, we've sent a verification code." }
}

export async function getSessionUser(userId) {
  const user = await User.findById(userId)
  return user ? toPublicUser(user) : null
}
