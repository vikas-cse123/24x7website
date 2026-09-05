import mongoose from 'mongoose'
import { isAppKey } from '../utils/imageFolders.js'
import { s3Config } from '../config/s3.js'

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

const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe'],
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    region: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    type: {
      type: String,
      enum: ['beach', 'hill-station', 'city', 'wildlife', 'cultural', 'adventure', 'religious', 'other'],
      default: 'other',
    },
    // Market segment used by homepage destination category tabs.
    category: {
      type: String,
      enum: ['international', 'domestic', 'weekend', 'other'],
      default: 'other',
    },
    // Legacy: kept for DB compatibility, not exposed in Admin UI
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    // Homepage Explore Destinations card image
    homepageImage: {
      type: imageSchema,
      default: () => ({}),
    },
    heroImage: {
      type: imageSchema,
      default: () => ({}),
    },
    gallery: {
      type: [imageSchema],
      default: [],
    },
    startingPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    currency: {
      type: String,
      uppercase: true,
      trim: true,
      default: 'INR',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    published: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
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

destinationSchema.index({ slug: 1 }, { unique: true })
destinationSchema.index({ published: 1, featured: 1, displayOrder: 1 })

// Public-facing shape. Never exposes createdBy/updatedBy.
// Rewrites stored S3 direct URLs to backend proxy (`/api/media/<key>`) so
// destinations display even when bucket policy blocks direct S3 GET for
// clean prefixes like `destinations/`.
function proxifyImage(img) {
  if (!img || typeof img !== 'object') return img || {}
  if (img.publicId && isAppKey(img.publicId)) {
    const p = s3Config.getProxyUrl(img.publicId)
    return { ...img, url: p, secureUrl: p }
  }
  return img
}
export function toPublicDestination(doc) {
  return {
    id: doc.id || doc._id?.toString(),
    name: doc.name,
    slug: doc.slug,
    country: doc.country,
    region: doc.region,
    type: doc.type,
    category: doc.category || 'other',
    shortDescription: doc.shortDescription,
    description: doc.description,
    homepageImage: proxifyImage(doc.homepageImage) || {},
    heroImage: proxifyImage(doc.heroImage) || {},
    gallery: Array.isArray(doc.gallery) ? doc.gallery.map(proxifyImage) : [],
    startingPrice: doc.startingPrice ?? null,
    currency: doc.currency,
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

const Destination = mongoose.model('Destination', destinationSchema)

export default Destination