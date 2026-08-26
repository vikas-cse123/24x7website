import crypto from 'node:crypto'
import config from '../config/index.js'

// ---------------------------------------------------------------------------
// Development/mock OTP service.
//
// NOTE: This is a DEVELOPMENT-ONLY implementation. It stores OTPs in an
// in-memory Map with a TTL. In development the generated OTP is also echoed
// back in the API response so the flow can be tested without a real SMS
// provider. There is NO real SMS sending.
//
// DEV CONVENIENCE: every generated OTP is the fixed value `123456` so testers
// do not need to read it from the API response. This is MOCK behaviour only —
// the production SMS provider must generate cryptographically random codes.
//
// When a production SMS provider is integrated (later milestone), replace the
// internals of this service with an SMSProvider abstraction while keeping the
// same public interface: `createOtp`, `verifyOtp`, `clearOtp`.
// ---------------------------------------------------------------------------

const store = new Map()

function keyFor(countryCode, mobile) {
  return `${countryCode}:${mobile}`
}

// DEVELOPMENT-ONLY: fixed mock code. Never reuse in production — replace this
// service with a real SMS provider that generates random OTPs.
const DEV_MOCK_OTP = '123456'

function generateOtp() {
  // 6-digit, leading zeroes allowed.
  return DEV_MOCK_OTP
}

export async function createOtp({ countryCode, mobile }) {
  if (config.otp.enabled === false) {
    throw new Error('OTP service is disabled')
  }

  const otp = generateOtp()
  const expiresAt = Date.now() + config.otp.ttlSeconds * 1000

  store.set(keyFor(countryCode, mobile), { otp, expiresAt })

  return {
    otp,
    expiresAt,
    ttlSeconds: config.otp.ttlSeconds,
    // Dev-only: whether the OTP is echoed in the response.
    devEchoOtp: config.otp.devEchoOtp,
  }
}

export async function verifyOtp({ countryCode, mobile, otp }) {
  const entry = store.get(keyFor(countryCode, mobile))
  if (!entry) {
    return { valid: false, reason: 'NO_OTP_REQUESTED' }
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(keyFor(countryCode, mobile))
    return { valid: false, reason: 'OTP_EXPIRED' }
  }

  // Constant-ish comparison to avoid trivial timing differences.
  const provided = String(otp)
  const expected = String(entry.otp)
  const valid =
    provided.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))

  if (valid) {
    // OTPs are single-use.
    store.delete(keyFor(countryCode, mobile))
    return { valid: true }
  }

  return { valid: false, reason: 'OTP_INVALID' }
}

export function clearOtp({ countryCode, mobile }) {
  store.delete(keyFor(countryCode, mobile))
}
