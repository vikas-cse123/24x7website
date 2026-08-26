import { z } from 'zod'

export const countryCodeSchema = z
  .string()
  .regex(/^\+\d{1,4}$/, 'Invalid country code')
  .default('+91')

export const mobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')

export const otpSchema = z
  .string()
  .regex(/^\d{6}$/, 'OTP must be exactly 6 digits')

export const sendOtpSchema = z.object({
  countryCode: countryCodeSchema,
  mobile: mobileSchema,
})

export const verifyOtpSchema = z.object({
  countryCode: countryCodeSchema,
  mobile: mobileSchema,
  otp: otpSchema,
})
