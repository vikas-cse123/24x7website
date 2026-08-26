import { z } from 'zod'
const OBJECT_ID = /^[0-9a-fA-F]{24}$/
export const createTripMediaSchema = z.object({
  tripId: z.string().regex(OBJECT_ID, 'Invalid trip'),
  mediaType: z.enum(['photo','video']).optional().default('photo'),
  publicId: z.string().trim().min(1).optional(),
  secureUrl: z.string().trim().url().or(z.literal('')).optional(),
  url: z.string().trim().url().or(z.literal('')).optional(),
  thumbnailUrl: z.string().trim().url().or(z.literal('')).optional(),
  width: z.coerce.number().optional().nullable(),
  height: z.coerce.number().optional().nullable(),
  format: z.string().trim().optional().default(''),
  bytes: z.coerce.number().optional().nullable(),
  altText: z.string().trim().max(200).optional().default(''),
  caption: z.string().trim().max(300).optional().default(''),
  published: z.boolean().optional().default(false),
  displayOrder: z.coerce.number().int().min(0).optional().default(0),
})
export const updateTripMediaSchema = createTripMediaSchema.partial()
export const listTripMediaQuerySchema = z.object({
  mediaType: z.enum(['photo','video']).optional(),
  published: z.enum(['true','false']).transform(v=>v==='true').optional(),
})
export const adminListTripMediaQuerySchema = z.object({
  tripId: z.string().regex(OBJECT_ID).optional(),
  mediaType: z.enum(['photo','video']).optional(),
  published: z.enum(['true','false']).transform(v=>v==='true').optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
})
