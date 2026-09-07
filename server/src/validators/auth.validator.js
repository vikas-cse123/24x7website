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

export const emailSchema = z
  .string()
  .trim()
  .email('Enter a valid email address')
  .max(120)

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(120)

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

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: emailSchema,
  phone: z.string().trim().min(1, 'Phone number is required').max(20),
  countryCode: countryCodeSchema.optional().default('+91'),
  password: passwordSchema,
})

export const verifyEmailSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
})

export const resendVerificationSchema = z.object({
  email: emailSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const verifyResetOtpSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
})

export const resetPasswordSchema = z.object({
  email: emailSchema,
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
