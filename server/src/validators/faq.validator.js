import { z } from 'zod'

const OBJECT_ID = /^[0-9a-fA-F]{24}$/

// Scope rule: an FAQ is global, destination-specific OR trip-specific — never
// both refs at once (enforced in service + here via superRefine on create).
const scopeFields = {
  destinationId: z.string().regex(OBJECT_ID, 'Invalid destination').nullable().optional(),
  tripId: z.string().regex(OBJECT_ID, 'Invalid trip').nullable().optional(),
}

export const createFaqSchema = z
  .object({
    question: z.string().trim().min(5, 'Question must be at least 5 characters').max(300),
    answer: z.string().trim().min(10, 'Answer must be at least 10 characters').max(2000),
    category: z.string().trim().max(60).optional(),
    ...scopeFields,
    displayOrder: z.coerce.number().int('Display order must be a whole number').min(0).optional(),
    published: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.destinationId && data.tripId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tripId'],
        message: 'An FAQ can belong to a destination or a trip — not both',
      })
    }
  })

export const updateFaqSchema = z
  .object({
    question: z.string().trim().min(5, 'Question must be at least 5 characters').max(300).optional(),
    answer: z.string().trim().min(10, 'Answer must be at least 10 characters').max(2000).optional(),
    category: z.string().trim().max(60).optional(),
    ...scopeFields,
    displayOrder: z.coerce.number().int().min(0).optional(),
    published: z.boolean().optional(),
  })

export const reorderFaqsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().regex(OBJECT_ID),
        displayOrder: z.coerce.number().int().min(0),
      })
    )
    .min(1)
    .max(200),
})

export const adminListFaqsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  // global | destination | trip | '' (all)
  scope: z.enum(['global', 'destination', 'trip']).optional(),
  published: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
})

export const faqLimitSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
})
