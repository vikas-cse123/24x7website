import { z } from 'zod'

const OBJECT_ID = /^[0-9a-fA-F]{24}$/
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const PHONE = /^[0-9+\-\s]{7,15}$/

export const MAX_TRAVELLERS = 20

const travellerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  gender: z.enum(['male', 'female', 'other']).nullable().optional(),
  dateOfBirth: z
    .string()
    .regex(DATE_ONLY, 'Use the YYYY-MM-DD date format')
    .refine((v) => new Date(`${v}T00:00:00Z`) < new Date(), 'Date of birth must be in the past')
    .nullable()
    .optional(),
  phone: z.string().trim().regex(PHONE, 'Enter a valid phone number').or(z.literal('')).optional(),
  email: z.string().trim().email('Enter a valid email address').or(z.literal('')).optional(),
})

// Everything here is re-validated server-side. Pricing fields (price/subtotal/
// total), bookingCode and userId are intentionally NOT accepted from clients —
// the server computes them from the TripBatch.
export const createBookingSchema = z
  .object({
    tripBatchId: z.string().regex(OBJECT_ID, 'Invalid departure'),
    travellerCount: z.coerce
      .number()
      .int('Traveller count must be a whole number')
      .min(1, 'At least 1 traveller is required')
      .max(MAX_TRAVELLERS, `Maximum ${MAX_TRAVELLERS} travellers per booking`),
    travellers: z.array(travellerSchema).min(1, 'Traveller details are required').max(MAX_TRAVELLERS),
    customerName: z.string().trim().min(1, 'Contact name is required').max(120),
    customerEmail: z.string().trim().email('Enter a valid email address').max(200),
    customerPhone: z.string().trim().regex(PHONE, 'Enter a valid phone number'),
    countryCode: z.string().trim().max(5).optional(),
    termsAccepted: z.literal(true, { message: 'You must accept the terms to book' }),
    // Client-generated key for the whole booking flow; makes double submits /
    // retries return the same booking instead of creating duplicates.
    idempotencyKey: z.string().trim().min(8, 'Invalid idempotency key').max(64),
  })
  .superRefine((data, ctx) => {
    if (data.travellers.length !== data.travellerCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['travellers'],
        message: `Details for exactly ${data.travellerCount} traveller(s) are required`,
      })
    }
  })

export const adminListBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  status: z.enum(['pending', 'confirmed', 'payment_pending', 'cancelled', 'completed']).optional(),
  paymentStatus: z.enum(['unpaid', 'pending', 'paid', 'failed', 'refunded']).optional(),
})

export const adminSetBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'payment_pending', 'completed']),
})
