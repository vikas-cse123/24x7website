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

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email address').max(120),
  phone: z.string().trim().min(1, 'Phone number is required').max(20),
  countryCode: z.string().regex(/^\+\d{1,4}$/, 'Invalid country code').default(COUNTRY_CODE),
  password: z.string().min(6, 'Password must be at least 6 characters').max(120),
})

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
})

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().email('Enter a valid email address'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters').max(120),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const emailOtpSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  otp: z.string().regex(OTP_PATTERN, 'OTP must be exactly 6 digits'),
})
