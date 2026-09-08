import mongoose from 'mongoose'
import { BLOG_CATEGORIES } from '../utils/blogCategories.js'

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

// Structured article content: an ordered list of typed blocks instead of a
// rich-text HTML blob (ADR-020). Rendered client-side by BlogContentView.
export const CONTENT_BLOCK_TYPES = ['heading', 'paragraph', 'list', 'image', 'quote']

const contentBlockSchema = new mongoose.Schema(
  {
    type: { type: String, enum: CONTENT_BLOCK_TYPES, required: true },
    // heading
    level: { type: Number, min: 2, max: 4, default: 2 },
    // heading / paragraph / quote text (paragraphs support [text](url) links)
    text: { type: String, trim: true, default: '', maxlength: 5000 },
    // list
    items: { type: [String], default: [] },
    // image
    url: { type: String, trim: true, default: '' },
    alt: { type: String, trim: true, default: '', maxlength: 200 },
    caption: { type: String, trim: true, default: '', maxlength: 300 },
  },
  { _id: false }
)

const blogFaqSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true, maxlength: 300, default: '' },
    answer: { type: String, trim: true, maxlength: 2000, default: '' },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: false }
)

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe'],
    },
    excerpt: { type: String, required: true, trim: true, maxlength: 400 },
    content: { type: [contentBlockSchema], required: true, default: [] },

    coverImage: { type: imageSchema, default: () => ({}) },
    faqs: { type: [blogFaqSchema], default: [] },
    category: {
      type: String,
      enum: BLOG_CATEGORIES,
      required: true,
      index: true,
    },
    tags: { type: [String], default: [], index: true },

    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      default: null,
      index: true,
    },

    // Server-controlled display author (set from the creating admin user).
    author: { type: String, trim: true, maxlength: 120, default: '24x7Chhutti Team' },
    readingTime: { type: Number, min: 1, default: 1 }, // minutes, computed server-side

    featured: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },

    seoTitle: { type: String, trim: true, maxlength: 120, default: '' },
    seoDescription: { type: String, trim: true, maxlength: 300, default: '' },

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
        delete ret.createdBy
        delete ret.updatedBy
        return ret
      },
    },
  }
)

blogSchema.index({ slug: 1 }, { unique: true })
blogSchema.index({ published: 1, featured: 1, publishedAt: -1 })
blogSchema.index({ title: 'text', excerpt: 'text', tags: 'text' })

// Estimate reading time from the words in all text-ish blocks (~200 wpm).
// Requirement: every blog must show >10 min, randomized 12 / 15 etc.
export function computeReadingTime(content) {
  let words = 0
  for (const block of content || []) {
    const texts = [
      block.text || '',
      ...(block.items || []),
      block.caption || '',
    ]
    for (const t of texts) words += String(t).split(/\s+/).filter(Boolean).length
  }
  let base = Math.round(words / 200)
  if (base <= 10) {
    const opts = [12, 15, 18]
    return opts[Math.floor(Math.random() * opts.length)]
  }
  return base
}

const Blog = mongoose.model('Blog', blogSchema)

export default Blog
