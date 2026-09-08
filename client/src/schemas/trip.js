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
  'bike',
  'spiritual',
  'match_maker',
  'wellness',
  'trek',
  'northern_lights_early_bird',
  'middle_age_trips',
  'upcoming_group_trips',
  'corporate',
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
  bike: 'Bike Trips',
  spiritual: 'Spiritual Trips',
  match_maker: 'The Match Maker',
  wellness: 'Wellness Retreats',
  trek: 'Treks',
  northern_lights_early_bird: 'Northern Lights Early Bird',
  middle_age_trips: 'Middle Age Trips',
  upcoming_group_trips: 'Upcoming Group Trips',
  corporate: 'Corporate Trips',
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

const tripReviewSchema = z.object({
  name: z.string().trim().min(1, 'Reviewer name is required').max(120),
  review: z.string().trim().min(1, 'Review text is required').max(5000),
  rating: z.coerce.number().int().min(1).max(5).optional().default(5),
  image: imageSchema.optional().default({}),
  published: z.boolean().optional().default(false),
  displayOrder: z.coerce.number().int().optional().default(0),
})

const costingRowSchema = z.object({
  mode: z.string().trim().max(80).optional().default(''),
  price: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : v),
    z.coerce.number().min(0, 'Price cannot be negative').nullable()
  ),
  originalPrice: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : v),
    z.coerce.number().min(0, 'Price cannot be negative').nullable()
  ),
})

const thingsToCarryItemSchema = z.object({
  icon: z.string().trim().max(20).optional().default(''),
  name: z.string().trim().min(1, 'Item name is required').max(100),
})

export const tripSchema = z.object({
  destinationId: z.string().min(1, 'Select a destination'),
  // Canonical name is backend-managed (derived from Trip Card Name on submit);
  // no Trip Name input exists in the admin UI.
  name: z.string().trim().max(160).optional().default(''),
  cardName: z.string().trim().min(1, 'Trip Card Name is required').max(160).optional().default(''),
  pageHeading: z.string().trim().max(160).optional().default(''),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe (lowercase letters, numbers, hyphens)')
    .optional()
    .or(z.literal('')),
  shortDescription: z.string().trim().max(5000),
  description: z.string().trim().max(10000),
  tripType: z.array(z.enum(TRIP_TYPES)).min(1, 'Select at least one trip type'),
  durationDays: z.coerce.number().int().min(1, 'At least 1 day'),
  durationNights: z.coerce.number().int().min(0),
  maxGroupSize: z.coerce.number().int().min(1),
  startingPrice: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : v),
    z.coerce.number().min(0, 'Price cannot be negative').nullable()
  ),
  originalPrice: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : v),
    z.coerce.number().min(0, 'Price cannot be negative').nullable()
  ),
  datesOnRequest: z.boolean().optional().default(false),
  departures: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date'))
    .max(30)
    .optional()
    .default([]),
  currency: z.string().trim().toUpperCase().max(10),
  heroImage: imageSchema.optional(),
  cardImage: imageSchema.optional().default({}),
  heroVideo: imageSchema.optional().default({}),
  itinerary: z.array(itineraryDaySchema).max(60),
  inclusions: z.array(z.string().trim().max(300)),
  exclusions: z.array(z.string().trim().max(300)),
  importantInformation: z.string().trim(),
  thingsToCarry: z.array(thingsToCarryItemSchema).max(30).optional().default([]),
  faqs: z.array(faqSchema).max(60),
  costing: z.array(costingRowSchema).max(30).optional().default([]),
  reviews: z.array(tripReviewSchema).max(50).optional().default([]),
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
  cardName: '',
  pageHeading: '',
  slug: '',
  shortDescription: '',
  description: '',
  tripType: ['group'],
  durationDays: 1,
  durationNights: 0,
  maxGroupSize: 10,
  startingPrice: null,
  originalPrice: null,
  datesOnRequest: false,
  departures: [],
  currency: 'INR',
  cardImage: { url: '', alt: '' },
  heroVideo: { url: '', alt: '' },
  itinerary: [],
  inclusions: [],
  exclusions: [],
  importantInformation: '',
  thingsToCarry: [],
  faqs: [],
  costing: [],
  reviews: [],
  featured: false,
  published: false,
  displayOrder: 0,
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
}