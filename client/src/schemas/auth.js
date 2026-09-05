import { z } from 'zod'

export const COUNTRY_CODE = '+91'

// Single source of truth for phone/OTP patterns. The LoginModal derives its
// button state and error visibility from these same values instead of
// maintaining a second validation implementation.
export const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/
export const INTERNATIONAL_MOBILE_PATTERN = /^\d{6,14}$/
export const OTP_PATTERN = /^\d{6}$/

const mobileBase = z
  .string()
  .regex(INTERNATIONAL_MOBILE_PATTERN, 'Enter a valid mobile number')

// India keeps strict 10-digit validation; other countries accept 6-14 digits.
function refineMobile(schema) {
  return schema.superRefine((v, ctx) => {
    if (v.countryCode === '+91' && !INDIAN_MOBILE_PATTERN.test(v.mobile)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mobile'],
        message: 'Enter a valid 10-digit Indian mobile number',
      })
    }
  })
}

export const sendOtpSchema = refineMobile(
  z.object({
    countryCode: z.string().regex(/^\+\d{1,4}$/, 'Invalid country code').default(COUNTRY_CODE),
    mobile: mobileBase,
  })
)

export const otpSchema = z.object({
  otp: z
    .string()
    .regex(OTP_PATTERN, 'OTP must be exactly 6 digits'),
})
