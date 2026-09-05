import { z } from 'zod'
import { SLUG_PATTERN } from '../utils/slugify.js'

const imageSchema = z.object({
  url: z
    .string()
    .trim()
    .refine((v) => v === '' || /^https?:\/\//.test(v) || v.startsWith('/api/media/'), 'Image URL must be a valid URL')
    .or(z.literal('')),
  publicId: z.string().trim().max(200).optional().default(''),
  alt: z.string().trim().max(200).optional().default(''),
})

// Field definitions WITHOUT defaults so the partial update schema never
// overwrites omitted fields with default values.
// shortDescription is kept for DB compat but not used in new Admin UI.
const destinationFields = {
  name: z.string().trim().min(1, 'Name is required').max(120),
  slug: z
    .string()
    .trim()
    .regex(SLUG_PATTERN, 'Slug must be URL-safe (lowercase letters, numbers, hyphens)')
    .optional(),
  country: z.string().trim().min(1, 'Country is required').max(80),
  region: z.string().trim().max(80).optional(),
  type: z.enum(['beach', 'hill-station', 'city', 'wildlife', 'cultural', 'adventure', 'religious', 'other']).optional(),
  category: z.enum(['international', 'domestic', 'weekend', 'other']).optional(),
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().optional(),
  homepageImage: imageSchema.optional(),
  heroImage: imageSchema.optional(),
  gallery: z.array(imageSchema).max(20).optional(),
  startingPrice: z.coerce.number().min(0).nullable().optional(),
  currency: z.string().trim().toUpperCase().max(10).optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  displayOrder: z.coerce.number().int().optional(),
  seoTitle: z.string().trim().max(120).optional(),
  seoDescription: z.string().trim().max(300).optional(),
  seoKeywords: z.string().trim().max(300).optional(),
}

// Keys uploaded to S3 during the current form session, reported by the admin
// UI so the server can garbage-collect uploads removed before saving. Never
// persisted — the destination service strips it from the stored document.
const sessionUploadKeysField = z.array(z.string().trim().max(200)).max(50).optional()

// Create: apply defaults for omitted optional fields.
export const createDestinationSchema = z.object({
  name: destinationFields.name,
  slug: destinationFields.slug,
  country: destinationFields.country,
  region: destinationFields.region.default(''),
  type: destinationFields.type.default('other'),
  category: destinationFields.category.default('other'),
  shortDescription: destinationFields.shortDescription.default(''),
  description: destinationFields.description.default(''),
  homepageImage: destinationFields.homepageImage.default({}),
  heroImage: destinationFields.heroImage.default({}),
  gallery: destinationFields.gallery.default([]),
  startingPrice: destinationFields.startingPrice.default(null),
  currency: destinationFields.currency.default('INR'),
  featured: destinationFields.featured.default(false),
  published: destinationFields.published.default(false),
  displayOrder: destinationFields.displayOrder.default(0),
  seoTitle: destinationFields.seoTitle.default(''),
  seoDescription: destinationFields.seoDescription.default(''),
  seoKeywords: destinationFields.seoKeywords.default(''),
  sessionUploadKeys: sessionUploadKeysField,
})

// Update: partial with NO defaults so omitted fields stay untouched.
export const updateDestinationSchema = z.object(destinationFields).partial().extend({
  sessionUploadKeys: sessionUploadKeysField,
})

// Public list query: pagination + optional filters.
export const listDestinationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  country: z.string().trim().optional(),
  category: z.enum(['international', 'domestic', 'weekend', 'other']).optional(),
  featured: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
})

// Admin list query: pagination + optional search.
export const adminListDestinationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  published: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
})