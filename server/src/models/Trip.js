import mongoose from 'mongoose'
import { isAppKey } from '../utils/imageFolders.js'
import { s3Config } from '../config/s3.js'
import { resolveTripPricing } from '../utils/pricing.js'

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, default: '' },
    // Populated by the media storage service (AWS S3); empty until then.
    publicId: { type: String, trim: true, default: '' },
    alt: { type: String, trim: true, default: '' },
    secureUrl: { type: String, trim: true, default: '' },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    format: { type: String, trim: true, default: '' },
    bytes: { type: Number, default: null },
    resourceType: { type: String, trim: true, default: 'image' },
    altText: { type: String, trim: true, default: '' },
  },
  { _id: false }
)

// One day of the itinerary, embedded in the Trip document.
const itineraryDaySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, min: 1, default: 1 },
    title: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    activities: { type: [String], default: [] },
    meals: { type: [String], default: [] },
    accommodation: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
  },
  { _id: false }
)

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true, default: '' },
    answer: { type: String, trim: true, default: '' },
  },
  { _id: false }
)

// Admin-curated review belonging to exactly one trip (independent from the
// user-generated verified-booking Review collection).
const tripReviewSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120, default: '' },
    review: { type: String, trim: true, maxlength: 5000, default: '' },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    image: { type: imageSchema, default: () => ({}) },
    published: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: false }
)

// One room-sharing costing row, embedded in the Trip document.
const costingRowSchema = new mongoose.Schema(
  {
    mode: { type: String, trim: true, maxlength: 80, default: '' },
    price: { type: Number, min: 0, default: null },
    originalPrice: { type: Number, min: 0, default: null },
  },
  { _id: false }
)

// Things to Carry item — compact pill with icon/emoji + name.
const thingsToCarryItemSchema = new mongoose.Schema(
  {
    icon: { type: String, trim: true, maxlength: 20, default: '' },
    name: { type: String, trim: true, maxlength: 100, default: '' },
  },
  { _id: false }
)

const tripSchema = new mongoose.Schema(
  {
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    // Independent display names: card vs. detail-page heading. Never
    // auto-copied; legacy trips fall back to `name` at render time.
    cardName: { type: String, trim: true, maxlength: 160, default: '' },
    pageHeading: { type: String, trim: true, maxlength: 160, default: '' },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe'],
    },
    tripCode: { type: String, required: true, trim: true, uppercase: true },
    shortDescription: { type: String, trim: true, maxlength: 300, default: '' },
    description: { type: String, trim: true, default: '' },
    tripType: {
      type: [String],
      enum: [
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
      ],
      default: ['group'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one trip type is required',
      },
    },
    durationDays: { type: Number, min: 1, default: 1 },
    durationNights: { type: Number, min: 0, default: 0 },
    maxGroupSize: { type: Number, min: 1, default: 10 },
    startingPrice: { type: Number, min: 0, default: null },
    // Original/MRP price. When present and above the selling price, the card
    // shows it struck through with a derived discount (never fabricated).
    originalPrice: { type: Number, min: 0, default: null },
    // Explicit "All dates available" mode — the card shows exactly that instead
    // of any dates, without requiring specific departure dates.
    datesOnRequest: { type: Boolean, default: false },
    // Trip-level departure dates (in addition to dated TripBatch inventory).
    departures: { type: [Date], default: [] },
    currency: { type: String, uppercase: true, trim: true, default: 'INR' },
    heroImage: { type: imageSchema, default: () => ({}) },
    // Independent media: card image (cards only) vs. hero image/video
    // (detail page only). Same media shape so S3 tracking is unchanged.
    cardImage: { type: imageSchema, default: () => ({}) },
    heroVideo: { type: imageSchema, default: () => ({}) },
    // NOTE: legacy documents may still store a `gallery` array in MongoDB.
    // The path is intentionally absent from the schema so new records never
    // create it; historical data is left untouched (never migrated/deleted).
    itinerary: { type: [itineraryDaySchema], default: [] },
    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    importantInformation: { type: String, trim: true, default: '' },
    thingsToCarry: { type: [thingsToCarryItemSchema], default: [] },
    faqs: { type: [faqSchema], default: [] },
    costing: { type: [costingRowSchema], default: [] },
    reviews: { type: [tripReviewSchema], default: [] },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    seoTitle: { type: String, trim: true, default: '' },
    seoDescription: { type: String, trim: true, default: '' },
    seoKeywords: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  }
)

tripSchema.index({ slug: 1 }, { unique: true })
tripSchema.index({ tripCode: 1 }, { unique: true })
tripSchema.index({ published: 1, featured: 1, displayOrder: 1 })

// Normalise a populated destination for public/admin output.
// Now includes destination heroImage so Trip pages can use destination hero.
function toPublicDestination(destination) {
  if (!destination || typeof destination !== 'object') return null
  return {
    id: destination.id || destination._id?.toString(),
    name: destination.name,
    slug: destination.slug,
    country: destination.country,
    heroImage: proxifyImage(destination.heroImage) || {},
    heroVideo: proxifyImage(destination.heroVideo) || {},
  }
}

// Review ordering: explicit displayOrder first, then insertion order.
function sortTripReviews(reviews) {
  return [...reviews].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
}

function toPublicReview(review) {
  return {
    name: review.name || '',
    review: review.review || '',
    rating: review.rating ?? 5,
    image: proxifyImage(review.image) || {},
    published: !!review.published,
    displayOrder: review.displayOrder ?? 0,
  }
}

function normalizeTripType(v) {
  if (!v) return ['group']
  if (Array.isArray(v)) return v.length ? v : ['group']
  return [String(v)]
}

// Public-facing shape. Never exposes createdBy/updatedBy. `destination` is
// populated by the service where available.
// Rewrites S3 direct URLs to backend proxy (`/api/media/<key>`) for clean
// prefixes so trips display even when bucket blocks direct S3 GET.
function proxifyImage(img) {
  if (!img || typeof img !== 'object') return img || {}
  if (img.publicId && isAppKey(img.publicId)) {
    const p = s3Config.getProxyUrl(img.publicId)
    return { ...img, url: p, secureUrl: p }
  }
  return img
}
export function toPublicTrip(doc) {
  const rawDest = doc.destinationId
  const destinationId =
    rawDest && typeof rawDest === 'object' && rawDest._id
      ? rawDest._id.toString()
      : rawDest?.toString?.() || null

  const pricing = resolveTripPricing({
    startingPrice: doc.startingPrice,
    originalPrice: doc.originalPrice,
    id: doc._id?.toString() || doc.id,
    tripCode: doc.tripCode,
    slug: doc.slug,
    name: doc.name,
  })

  return {
    id: doc.id || doc._id?.toString(),
    destinationId,
    destination: toPublicDestination(rawDest),
    name: doc.name,
    cardName: doc.cardName || '',
    pageHeading: doc.pageHeading || '',
    slug: doc.slug,
    tripCode: doc.tripCode,
    shortDescription: doc.shortDescription,
    description: doc.description,
    tripType: normalizeTripType(doc.tripType),
    durationDays: doc.durationDays,
    durationNights: doc.durationNights,
    maxGroupSize: doc.maxGroupSize,
    startingPrice: doc.startingPrice ?? null,
    originalPrice: pricing.originalPrice,
    datesOnRequest: !!doc.datesOnRequest,
    departures: Array.isArray(doc.departures) ? doc.departures : [],
    currency: doc.currency,
    heroImage: proxifyImage(doc.heroImage) || {},
    cardImage: proxifyImage(doc.cardImage) || {},
    heroVideo: proxifyImage(doc.heroVideo) || {},
    itinerary: doc.itinerary || [],
    inclusions: doc.inclusions || [],
    exclusions: doc.exclusions || [],
    importantInformation: doc.importantInformation,
    thingsToCarry: Array.isArray(doc.thingsToCarry) ? doc.thingsToCarry : [],
    faqs: doc.faqs || [],
    costing: Array.isArray(doc.costing) ? doc.costing : [],
    // Public shape exposes published reviews only — unpublished drafts stay
    // private. Admin paths use toAdminTrip below.
    reviews: Array.isArray(doc.reviews)
      ? sortTripReviews(doc.reviews.filter((r) => r && r.published).map(toPublicReview))
      : [],
    featured: doc.featured,
    published: doc.published,
    displayOrder: doc.displayOrder,
    seoTitle: doc.seoTitle,
    seoDescription: doc.seoDescription,
    seoKeywords: doc.seoKeywords,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

const Trip = mongoose.model('Trip', tripSchema)

export default Trip

// Admin shape: everything in toPublicTrip, but with ALL trip reviews
// (published and drafts) so the admin form can manage them.
export function toAdminTrip(doc) {
  const trip = toPublicTrip(doc)
  const raw = doc.reviews || doc._doc?.reviews || []
  trip.reviews = Array.isArray(raw) ? sortTripReviews(raw.map(toPublicReview)) : []
  return trip
}