import { z } from 'zod'
import { SLUG_PATTERN } from '../utils/slugify.js'
import { TRIP_TYPES } from '../utils/tripTypes.js'

const OBJECT_ID = /^[0-9a-fA-F]{24}$/

const imageSchema = z.object({
  url: z.string().trim().url('Image URL must be a valid URL').or(z.literal('')),
  publicId: z.string().trim().max(200).optional().default(''),
  alt: z.string().trim().max(200).optional().default(''),
})

const itineraryDaySchema = z.object({
  dayNumber: z.coerce.number().int().min(1).default(1),
  title: z.string().trim().max(200).default(''),
  description: z.string().trim().default(''),
  activities: z.array(z.string().trim().max(300)).max(30).default([]),
  meals: z.array(z.string().trim().max(200)).max(30).default([]),
  accommodation: z.string().trim().max(200).default(''),
  notes: z.string().trim().default(''),
})

const faqSchema = z.object({
  question: z.string().trim().min(1, 'Question is required').max(300),
  answer: z.string().trim().max(2000),
})

// Field definitions WITHOUT defaults so the partial update schema never
// overwrites omitted fields with default values.
const tripFields = {
  destinationId: z.string().regex(OBJECT_ID, 'Invalid destination'),
  name: z.string().trim().min(1, 'Name is required').max(160),
  slug: z
    .string()
    .trim()
    .regex(SLUG_PATTERN, 'Slug must be URL-safe (lowercase letters, numbers, hyphens)')
    .optional(),
  // tripCode is intentionally NOT accepted from clients.
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().optional(),
  tripType: z.enum(TRIP_TYPES).optional(),
  durationDays: z.coerce.number().int().min(1, 'Duration days must be at least 1').optional(),
  durationNights: z.coerce.number().int().min(0).optional(),
  maxGroupSize: z.coerce.number().int().min(1).optional(),
  startingPrice: z.coerce.number().min(0).nullable().optional(),
  currency: z.string().trim().toUpperCase().max(10).optional(),
  heroImage: imageSchema.optional(),
  gallery: z.array(imageSchema).max(30).optional(),
  itinerary: z.array(itineraryDaySchema).max(60).optional(),
  inclusions: z.array(z.string().trim().max(300)).max(60).optional(),
  exclusions: z.array(z.string().trim().max(300)).max(60).optional(),
  importantInformation: z.string().trim().optional(),
  faqs: z.array(faqSchema).max(60).optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  displayOrder: z.coerce.number().int().optional(),
  seoTitle: z.string().trim().max(120).optional(),
  seoDescription: z.string().trim().max(300).optional(),
  seoKeywords: z.string().trim().max(300).optional(),
}

// Create: apply defaults for omitted optional fields.
export const createTripSchema = z.object({
  destinationId: tripFields.destinationId,
  name: tripFields.name,
  slug: tripFields.slug,
  shortDescription: tripFields.shortDescription.default(''),
  description: tripFields.description.default(''),
  tripType: tripFields.tripType.default('group'),
  durationDays: tripFields.durationDays.default(1),
  durationNights: tripFields.durationNights.default(0),
  maxGroupSize: tripFields.maxGroupSize.default(10),
  startingPrice: tripFields.startingPrice.default(null),
  currency: tripFields.currency.default('INR'),
  heroImage: tripFields.heroImage.default({}),
  gallery: tripFields.gallery.default([]),
  itinerary: tripFields.itinerary.default([]),
  inclusions: tripFields.inclusions.default([]),
  exclusions: tripFields.exclusions.default([]),
  importantInformation: tripFields.importantInformation.default(''),
  faqs: tripFields.faqs.default([]),
  featured: tripFields.featured.default(false),
  published: tripFields.published.default(false),
  displayOrder: tripFields.displayOrder.default(0),
  seoTitle: tripFields.seoTitle.default(''),
  seoDescription: tripFields.seoDescription.default(''),
  seoKeywords: tripFields.seoKeywords.default(''),
})

// Update: partial with NO defaults so omitted fields stay untouched.
export const updateTripSchema = z.object(tripFields).partial()

export const TRIP_SORT_OPTIONS = ['recommended', 'price_asc', 'price_desc', 'departure_asc']

const DATE_ONLY_QUERY = /^\d{4}-\d{2}-\d{2}$/
const dateOnlyQuery = z
  .string()
  .regex(DATE_ONLY_QUERY, 'Use the YYYY-MM-DD date format')

// Public list query: pagination + filters + sorting.
// Price/date filters and price/departure sorts are resolved against upcoming
// PUBLIC TripBatch data (see services/trip.service.js listPublic).
export const listTripsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(12),
    search: z.string().trim().optional(),
    destination: z.string().trim().optional(),
    tripType: z.enum(TRIP_TYPES).optional(),
    category: z.enum(['international', 'domestic', 'weekend', 'other']).optional(),
    featured: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    minPrice: z.coerce.number().min(0, 'Minimum price cannot be negative').optional(),
    maxPrice: z.coerce.number().min(0, 'Maximum price cannot be negative').optional(),
    departureDate: dateOnlyQuery.optional(),
    departureFrom: dateOnlyQuery.optional(),
    departureTo: dateOnlyQuery.optional(),
    sort: z.enum(TRIP_SORT_OPTIONS).optional(),
    // Embed upcoming public departures per trip item (discovery/homepage cards).
    includeBatches: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.minPrice !== undefined &&
      data.maxPrice !== undefined &&
      data.minPrice > data.maxPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxPrice'],
        message: 'Maximum price cannot be less than the minimum price',
      })
    }
    if (
      data.departureFrom &&
      data.departureTo &&
      data.departureTo < data.departureFrom
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['departureTo'],
        message: 'Departure range end cannot be before its start',
      })
    }
  })

// Admin list query: pagination + optional filters.
export const adminListTripsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  destinationId: z.string().regex(OBJECT_ID).optional(),
  tripType: z.enum(TRIP_TYPES).optional(),
  published: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
})