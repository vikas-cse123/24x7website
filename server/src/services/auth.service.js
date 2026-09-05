import User, { toPublicUser } from '../models/User.js'
import { createOtp, verifyOtp } from './otp.service.js'
import { signToken } from '../utils/tokens.js'
import { ROLES } from '../utils/roles.js'

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

export async function getSessionUser(userId) {
  const user = await User.findById(userId)
  return user ? toPublicUser(user) : null
}
