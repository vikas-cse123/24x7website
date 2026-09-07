import crypto from 'node:crypto'
import Otp from '../models/Otp.js'
import config from '../config/index.js'

const OTP_LENGTH = 6

function generateOtp() {
  let otp = ''
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += crypto.randomInt(0, 10).toString()
  }
  return otp
}

export async function createEmailOtp(email, type = 'emailVerification') {
  const normalizedEmail = String(email).trim().toLowerCase()
  const now = Date.now()

  // Throttle resend: check last OTP for same email+type within cooldown
  const lastOtp = await Otp.findOne({ email: normalizedEmail, type }).sort({ createdAt: -1 })
  if (lastOtp) {
    const elapsed = now - new Date(lastOtp.createdAt).getTime()
    const cooldownMs = config.otp.resendCooldownSeconds * 1000
    if (elapsed < cooldownMs) {
      const waitSec = Math.ceil((cooldownMs - elapsed) / 1000)
      const err = new Error(`Please wait ${waitSec}s before requesting another OTP`)
      err.status = 429
      throw err
    }
  }

  // Invalidate previous OTPs for this email+type
  await Otp.deleteMany({ email: normalizedEmail, type })

  const otp = generateOtp()
  const expiresAt = new Date(now + config.otp.emailTtlSeconds * 1000)

  await Otp.create({
    email: normalizedEmail,
    otp,
    type,
    expiresAt,
    attempts: 0,
  })

  return { otp, expiresAt }
}

export async function verifyEmailOtp(email, otp, type = 'emailVerification') {
  const normalizedEmail = String(email).trim().toLowerCase()
  const normalizedOtp = String(otp).trim()

  const record = await Otp.findOne({ email: normalizedEmail, type }).sort({ createdAt: -1 })
  if (!record) {
    return { valid: false, reason: 'NO_OTP_REQUESTED' }
  }

  if (new Date() > record.expiresAt) {
    await Otp.deleteMany({ email: normalizedEmail, type })
    return { valid: false, reason: 'OTP_EXPIRED' }
  }

  if (record.attempts >= config.otp.maxAttempts) {
    await Otp.deleteMany({ email: normalizedEmail, type })
    return { valid: false, reason: 'OTP_ATTEMPTS_EXCEEDED' }
  }

  // Strict string comparison preserves leading zeros
  if (record.otp !== normalizedOtp) {
    record.attempts += 1
    await record.save()
    if (record.attempts >= config.otp.maxAttempts) {
      await Otp.deleteMany({ email: normalizedEmail, type })
      return { valid: false, reason: 'OTP_ATTEMPTS_EXCEEDED' }
    }
    return { valid: false, reason: 'OTP_INVALID' }
  }

  // Success: invalidate all OTPs for this email+type (one-time use)
  await Otp.deleteMany({ email: normalizedEmail, type })
  return { valid: true }
}

export async function clearEmailOtp(email, type) {
  const normalizedEmail = String(email).trim().toLowerCase()
  await Otp.deleteMany({ email: normalizedEmail, type })
}
