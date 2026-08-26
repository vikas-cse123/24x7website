import { z } from 'zod'

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const PHONE = /^[0-9+\-\s]{7,15}$/

// Profile updates. Deliberately narrow: mobile/countryCode are the OTP login
// identity (ADR-018) and role/verification flags are server-owned, so none of
// them are accepted here.
export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email address').max(200),
})

export const accountBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  status: z
    .enum(['pending', 'confirmed', 'payment_pending', 'cancelled', 'completed'])
    .optional(),
})

const travellerFields = {
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.string().trim().email('Enter a valid email address').or(z.literal('')).optional(),
  phone: z.string().trim().regex(PHONE, 'Enter a valid phone number').or(z.literal('')).optional(),
  countryCode: z.string().trim().max(5).optional(),
  gender: z.enum(['male', 'female', 'other']).nullable().optional(),
  dateOfBirth: z
    .string()
    .regex(DATE_ONLY, 'Use the YYYY-MM-DD date format')
    .refine((v) => new Date(`${v}T00:00:00Z`) < new Date(), 'Date of birth must be in the past')
    .nullable()
    .optional(),
}

export const createTravellerSchema = z.object(travellerFields)

export const updateTravellerSchema = z.object(travellerFields).partial()
