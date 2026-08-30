import { z } from 'zod'

export const countryCodeSchema = z
  .string()
  .regex(/^\+\d{1,4}$/, 'Invalid country code')
  .default('+91')

// Generic international mobile: 6-14 digits. Indian numbers (+91) keep the
// strict 10-digit [6-9] validation via the refinement below.
export const mobileSchema = z
  .string()
  .regex(/^\d{6,14}$/, 'Enter a valid mobile number')

function refineIndianMobile(schema) {
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

export const otpSchema = z
  .string()
  .regex(/^\d{6}$/, 'OTP must be exactly 6 digits')

export const sendOtpSchema = refineIndianMobile(
  z.object({
    countryCode: countryCodeSchema,
    mobile: mobileSchema,
  })
)

export const verifyOtpSchema = refineIndianMobile(
  z.object({
    countryCode: countryCodeSchema,
    mobile: mobileSchema,
    otp: otpSchema,
  })
)
