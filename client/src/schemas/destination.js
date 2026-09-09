import { z } from 'zod'

export const DESTINATION_TYPES = [
  'beach',
  'hill-station',
  'city',
  'wildlife',
  'cultural',
  'adventure',
  'religious',
  'other',
]

export const DESTINATION_CATEGORIES = ['international', 'domestic', 'weekend', 'domestic & weekend', 'other']

const imageSchema = z.object({
  url: z.string().trim().optional().default(''),
  secureUrl: z.string().trim().optional().default(''),
  publicId: z.string().trim().optional().default(''),
  width: z.coerce.number().optional().nullable(),
  height: z.coerce.number().optional().nullable(),
  format: z.string().trim().optional().default(''),
  bytes: z.coerce.number().optional().nullable(),
  alt: z.string().trim().max(200).optional().default(''),
  altText: z.string().trim().max(200).optional().default(''),
})

export const destinationSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe (lowercase letters, numbers, hyphens)')
    .optional()
    .or(z.literal('')),
  country: z.string().trim().min(1, 'Country is required').max(80),
  region: z.string().trim().max(80),
  type: z.enum(DESTINATION_TYPES),
  category: z
    .union([
      z.enum(DESTINATION_CATEGORIES),
      z.array(z.enum(['international', 'domestic', 'weekend', 'other'])).min(1),
    ])
    .transform((v) => {
      if (v === 'domestic & weekend') return ['domestic', 'weekend']
      if (Array.isArray(v)) return v
      return v
    }),
  description: z.string().trim().max(20000).optional().default(''),
  homepageImage: imageSchema,
  homepageName: z.string().trim().max(120).optional().default(''),
  heroImage: imageSchema,
  heroVideo: imageSchema,
  gallery: z.array(imageSchema).max(20),
  startingPrice: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : v),
    z.coerce.number().min(0, 'Price cannot be negative').nullable()
  ),
  currency: z.string().trim().toUpperCase().max(10),
  featured: z.boolean(),
  published: z.boolean(),
  displayOrder: z.coerce.number().int().min(0),
  seoTitle: z.string().trim().max(120),
  seoDescription: z.string().trim().max(300),
  seoKeywords: z.string().trim().max(300),
})

export const destinationFormDefault = {
  name: '',
  slug: '',
  country: '',
  region: '',
  type: 'other',
  category: 'international',
  description: '',
  homepageImage: { url: '', alt: '' },
  homepageName: '',
  heroImage: { url: '', alt: '' },
  heroVideo: { url: '', alt: '' },
  gallery: [],
  startingPrice: null,
  currency: 'INR',
  featured: false,
  published: false,
  displayOrder: 0,
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
}