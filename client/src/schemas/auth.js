import { z } from 'zod'

export const COUNTRY_CODE = '+91'

export const sendOtpSchema = z.object({
  countryCode: z.string().default(COUNTRY_CODE),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  terms: z.boolean().refine((v) => v === true, {
    message: 'Please accept the Terms & Conditions to continue',
  }),
})

export const otpSchema = z.object({
  otp: z
    .string()
    .regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
})
