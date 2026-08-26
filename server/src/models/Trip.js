import mongoose from 'mongoose'

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, default: '' },
    // Populated by the future Cloudinary media service; empty until then.
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

const tripSchema = new mongoose.Schema(
  {
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
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
      type: String,
      enum: ['group', 'customized', 'honeymoon', 'family', 'adventure', 'weekend', 'international', 'domestic'],
      default: 'group',
    },
    durationDays: { type: Number, min: 1, default: 1 },
    durationNights: { type: Number, min: 0, default: 0 },
    maxGroupSize: { type: Number, min: 1, default: 10 },
    startingPrice: { type: Number, min: 0, default: null },
    currency: { type: String, uppercase: true, trim: true, default: 'INR' },
    heroImage: { type: imageSchema, default: () => ({}) },
    gallery: { type: [imageSchema], default: [] },
    itinerary: { type: [itineraryDaySchema], default: [] },
    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    importantInformation: { type: String, trim: true, default: '' },
    faqs: { type: [faqSchema], default: [] },
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
function toPublicDestination(destination) {
  if (!destination || typeof destination !== 'object') return null
  return {
    id: destination.id || destination._id?.toString(),
    name: destination.name,
    slug: destination.slug,
    country: destination.country,
  }
}

// Public-facing shape. Never exposes createdBy/updatedBy. `destination` is
// populated by the service where available.
export function toPublicTrip(doc) {
  const rawDest = doc.destinationId
  const destinationId =
    rawDest && typeof rawDest === 'object' && rawDest._id
      ? rawDest._id.toString()
      : rawDest?.toString?.() || null

  return {
    id: doc.id || doc._id?.toString(),
    destinationId,
    destination: toPublicDestination(rawDest),
    name: doc.name,
    slug: doc.slug,
    tripCode: doc.tripCode,
    shortDescription: doc.shortDescription,
    description: doc.description,
    tripType: doc.tripType,
    durationDays: doc.durationDays,
    durationNights: doc.durationNights,
    maxGroupSize: doc.maxGroupSize,
    startingPrice: doc.startingPrice ?? null,
    currency: doc.currency,
    heroImage: doc.heroImage || {},
    gallery: doc.gallery || [],
    itinerary: doc.itinerary || [],
    inclusions: doc.inclusions || [],
    exclusions: doc.exclusions || [],
    importantInformation: doc.importantInformation,
    faqs: doc.faqs || [],
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