import { z } from 'zod'

export const MAX_TRAVELLERS = 20

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const PHONE = /^[0-9+\-\s]{7,15}$/

// Mirrors the server validator. The wizard collects travellers + contact in one
// form; the server recomputes ALL pricing and re-validates everything.
export const travellerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .or(z.literal(''))
    .optional()
    .default(''),
  phone: z
    .string()
    .trim()
    .regex(PHONE, 'Enter a valid phone number')
    .or(z.literal(''))
    .optional()
    .default(''),
})

export const bookingFormSchema = z
  .object({
    travellerCount: z.coerce.number().int().min(1).max(MAX_TRAVELLERS),
    travellers: z.array(travellerSchema).min(1),
    customerName: z.string().trim().min(1, 'Contact name is required').max(120),
    customerEmail: z.string().trim().email('Enter a valid email address'),
    customerPhone: z.string().trim().regex(PHONE, 'Enter a valid phone number'),
    termsAccepted: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.travellers.length !== data.travellerCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['travellers'],
        message: `Details for exactly ${data.travellerCount} traveller(s) are required`,
      })
    }
    if (!data.termsAccepted) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['termsAccepted'],
        message: 'You must accept the terms to book',
      })
    }
  })

// Client-side estimate only — the server total is authoritative and is what the
// confirmation page shows.
export function estimatePricing(batch, travellerCount) {
  const unitPrice = Number(batch?.price) || 0
  const subtotal = unitPrice * travellerCount
  const discountPerHead =
    batch?.originalPrice != null && Number(batch.originalPrice) > unitPrice
      ? Number(batch.originalPrice) - unitPrice
      : 0
  const discountAmount = discountPerHead * travellerCount
  return {
    unitPrice,
    subtotal,
    discountAmount,
    totalAmount: subtotal - discountAmount,
    currency: batch?.currency || 'INR',
  }
}
