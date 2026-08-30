import { z } from 'zod'

export const COUNTRY_CODE = '+91'

const mobileBase = z
  .string()
  .regex(/^\d{6,14}$/, 'Enter a valid mobile number')

// India keeps strict 10-digit validation; other countries accept 6-14 digits.
function refineMobile(schema) {
  return schema.superRefine((v, ctx) => {
    if (v.countryCode === '+91' && !/^[6-9]\d{9}$/.test(v.mobile)) {
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
    .regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
})
