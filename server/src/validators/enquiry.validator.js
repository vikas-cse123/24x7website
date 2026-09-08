import { z } from 'zod'

const OBJECT_ID = /^[0-9a-fA-F]{24}$/
const PHONE = /^[6-9]\d{9}$/

// Public enquiry submission (e.g. the custom-trip "Plan Your Dream Trip" form).
// Visitors may be logged out, so no auth field is required here. Server-side
// validation is the real security boundary — never trust the client.
export const createEnquirySchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long'),
    destinationId: z
      .string()
      .trim()
      .min(1, 'Please select a destination')
      .regex(OBJECT_ID, 'Please select a destination')
      .optional(),
    destinationName: z.string().trim().max(120).optional(),
    phone: z
      .string()
      .trim()
      .regex(PHONE, 'Please enter a valid mobile number')
      .max(15, 'Please enter a valid mobile number'),
    countryCode: z.string().trim().max(6).optional().default('+91'),
    email: z.union([z.string().trim().email('Please enter a valid email address').max(200), z.literal('')]).optional(),
    message: z.string().trim().max(2000).optional().default(''),
    // Channel that produced the lead. Allowed set keeps the naming convention
    // consistent (lowercase snake_case); unexpected values are rejected.
    source: z
      .enum(['website', 'custom_trip', 'contact_form', 'trip_page', 'destination_page'])
      .optional()
      .default('website'),
  })
  .superRefine((data, ctx) => {
    if (!data.destinationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destinationId'],
        message: 'Please select a destination',
      })
    }
  })

export const updateEnquiryStatusSchema = z.object({
  status: z.enum(['new', 'in-progress', 'resolved']),
})

export const listEnquiriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['new', 'in-progress', 'resolved']).optional(),
  source: z.string().trim().max(60).optional(),
  search: z.string().trim().max(200).optional(),
})