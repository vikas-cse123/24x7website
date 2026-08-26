import { z } from 'zod'

export const TRIP_TYPES = [
  'group',
  'customized',
  'honeymoon',
  'family',
  'adventure',
  'weekend',
  'international',
  'domestic',
]

export const TRIP_TYPE_LABELS = {
  group: 'Group',
  customized: 'Customized',
  honeymoon: 'Honeymoon',
  family: 'Family',
  adventure: 'Adventure',
  weekend: 'Weekend',
  international: 'International',
  domestic: 'Domestic',
}

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

const itineraryDaySchema = z.object({
  dayNumber: z.coerce.number().int().min(1),
  title: z.string().trim().max(200),
  description: z.string().trim(),
  activities: z.array(z.string().trim().max(300)),
  meals: z.array(z.string().trim().max(200)),
  accommodation: z.string().trim().max(200),
  notes: z.string().trim(),
})

const faqSchema = z.object({
  question: z.string().trim().min(1, 'Question is required').max(300),
  answer: z.string().trim().max(2000),
})

export const tripSchema = z.object({
  destinationId: z.string().min(1, 'Select a destination'),
  name: z.string().trim().min(1, 'Trip name is required').max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe (lowercase letters, numbers, hyphens)')
    .optional()
    .or(z.literal('')),
  shortDescription: z.string().trim().max(300),
  description: z.string().trim(),
  tripType: z.enum(TRIP_TYPES),
  durationDays: z.coerce.number().int().min(1, 'At least 1 day'),
  durationNights: z.coerce.number().int().min(0),
  maxGroupSize: z.coerce.number().int().min(1),
  startingPrice: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : v),
    z.coerce.number().min(0, 'Price cannot be negative').nullable()
  ),
  currency: z.string().trim().toUpperCase().max(10),
  heroImage: imageSchema,
  gallery: z.array(imageSchema).max(30),
  itinerary: z.array(itineraryDaySchema).max(60),
  inclusions: z.array(z.string().trim().max(300)),
  exclusions: z.array(z.string().trim().max(300)),
  importantInformation: z.string().trim(),
  faqs: z.array(faqSchema).max(60),
  featured: z.boolean(),
  published: z.boolean(),
  displayOrder: z.coerce.number().int().min(0),
  seoTitle: z.string().trim().max(120),
  seoDescription: z.string().trim().max(300),
  seoKeywords: z.string().trim().max(300),
})

export const tripFormDefault = {
  destinationId: '',
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  tripType: 'group',
  durationDays: 1,
  durationNights: 0,
  maxGroupSize: 10,
  startingPrice: null,
  currency: 'INR',
  heroImage: { url: '', alt: '' },
  gallery: [],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  importantInformation: '',
  faqs: [],
  featured: false,
  published: false,
  displayOrder: 0,
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
}