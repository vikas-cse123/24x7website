import Blog, { computeReadingTime } from '../models/Blog.js'
import Destination from '../models/Destination.js'
import User from '../models/User.js'
import { slugify, ensureUniqueSlug } from '../utils/slugify.js'
import * as imageStorage from './imageStorage.service.js'
import { isAppKey } from '../utils/imageFolders.js'
import { s3Config } from '../config/s3.js'

const PUBLIC_PROJECTION = '-createdBy -updatedBy -__v'
const DEST_POPULATE = 'name slug country'

function badRequest(message, errors) {
  const err = new Error(message)
  err.status = 400
  if (errors) err.errors = errors
  return err
}
function notFound(message = 'Blog not found') {
  const err = new Error(message)
  err.status = 404
  return err
}

async function ensureDestinationExists(destinationId) {
  if (!destinationId) return
  const exists = await Destination.exists({ _id: destinationId })
  if (!exists) throw badRequest('Selected destination does not exist')
}

function proxifyImage(img) {
  if (!img || typeof img !== 'object') return img || {}
  if (img.publicId && isAppKey(img.publicId)) {
    const p = s3Config.getProxyUrl(img.publicId)
    return { ...img, url: p, secureUrl: p }
  }
  return img
}

function sortFaqs(faqs) {
  if (!Array.isArray(faqs)) return []
  return [...faqs].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
}
export function toPublicBlog(doc, options = {}) {
  if (!doc) return null
  const dest = doc.destinationId && typeof doc.destinationId === 'object' ? doc.destinationId : null
  const out = {
    id: doc.id || doc._id?.toString(),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt,
    content: options.includeContent ? doc.content : undefined,
    coverImage: proxifyImage(doc.coverImage) || {},
    category: doc.category,
    tags: doc.tags || [],
    destination: dest
      ? { id: dest._id?.toString() || dest.id, name: dest.name, slug: dest.slug, country: dest.country }
      : null,
    faqs: sortFaqs(doc.faqs),
    author: doc.author,
    readingTime: doc.readingTime,
    featured: doc.featured,
    published: doc.published,
    publishedAt: doc.publishedAt,
    seoTitle: doc.seoTitle,
    seoDescription: doc.seoDescription,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
  return out
}

// --- admin -------------------------------------------------------------------

export async function listAdmin({ page = 1, limit = 12, search, category, featured, published }) {
  const filter = {}
  if (category) filter.category = category
  if (featured !== undefined) filter.featured = featured
  if (published !== undefined) filter.published = published
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ title: rx }, { excerpt: rx }, { tags: rx }, { author: rx }]
  }

  const total = await Blog.countDocuments(filter)
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)

  const items = await Blog.find(filter)
    .populate('destinationId', DEST_POPULATE)
    .sort({ updatedAt: -1 })
    .skip((safePage - 1) * limit)
    .limit(limit)
    .lean()

  return { items: items.map((d) => toPublicBlog(d)), page: safePage, limit, total, totalPages }
}

export async function getAdminById(id) {
  const doc = await Blog.findById(id).populate('destinationId', DEST_POPULATE).lean()
  return doc ? toPublicBlog(doc, { includeContent: true }) : null
}

export async function create(data, adminUser) {
  await ensureDestinationExists(data.destinationId)

  let slug = data.slug ? data.slug.trim() : slugify(data.title)
  if (!slug) slug = 'blog'
  slug = await ensureUniqueSlug(Blog, slug)

  // Server-controlled fields.
  const author = adminUser?.name?.trim() || '24x7Chhutti Team' 

  const doc = await Blog.create({
    ...data,
    slug,
    author,
    readingTime: computeReadingTime(data.content),
    publishedAt: data.published ? new Date() : null,
    createdBy: adminUser.id,
    updatedBy: adminUser.id,
  })

  return toPublicBlog(await doc.populate('destinationId', DEST_POPULATE), { includeContent: true })
}

export async function update(id, data, adminUser) {
  const existing = await Blog.findById(id)
  if (!existing) return null

  if (data.destinationId) await ensureDestinationExists(data.destinationId)

  const patch = { ...data }
  delete patch.author // server-controlled

  // Slug preserved unless explicitly provided (ADR-011 pattern).
  if (patch.slug) {
    patch.slug = await ensureUniqueSlug(Blog, patch.slug.trim(), id)
  } else {
    delete patch.slug
  }

  if (patch.content) patch.readingTime = computeReadingTime(patch.content)

  // Publishing transitions keep publishedAt meaningful.
  if (patch.published === true && !existing.published) patch.publishedAt = existing.publishedAt || new Date()
  if (patch.published === false) patch.publishedAt = null

  const keysBefore = imageStorage.collectKeys(existing.toObject())
  Object.assign(existing, patch, { updatedBy: adminUser.id })
  await existing.save()

  // Delete S3 images that were removed/replaced by this update.
  // Reference-aware: objects still referenced by other records are skipped.
  const staleKeys = imageStorage.removedKeys(keysBefore, existing.toObject())
  await imageStorage.cleanupUnreferenced(staleKeys, `Blog ${id} update`)

  return toPublicBlog(await existing.populate('destinationId', DEST_POPULATE), { includeContent: true })
}

export async function setPublished(id, published, adminUserId) {
  const doc = await Blog.findById(id)
  if (!doc) return null
  doc.published = published
  if (published && !doc.publishedAt) doc.publishedAt = new Date()
  if (!published) doc.publishedAt = null
  doc.updatedBy = adminUserId
  await doc.save()
  return toPublicBlog(doc, { includeContent: true })
}

export async function remove(id) {
  const doc = await Blog.findByIdAndDelete(id).lean()
  if (!doc) return null
  // Reference-aware S3 cleanup of the cover image object.
  await imageStorage.cleanupUnreferenced(imageStorage.collectKeys(doc), `Blog ${id} delete`)
  return { id: doc._id.toString(), deleted: true }
}

// --- public -------------------------------------------------------------------

// Resolves a destination slug into an id; returns null when unknown/unpublished.
async function destinationIdFromSlug(slug) {
  const dest = await Destination.findOne({ slug, published: true }).select('_id').lean()
  return dest?._id || null
}

export async function listPublished({
  page = 1,
  limit = 9,
  search,
  category,
  destination,
  tag,
  featured,
}) {
  const filter = { published: true }

  if (destination) {
    const destId = await destinationIdFromSlug(destination)
    if (!destId) return { items: [], page, limit, total: 0, totalPages: 1, destination: null }
    filter.destinationId = destId
  }
  if (category) filter.category = category
  if (featured !== undefined) filter.featured = featured
  if (tag) filter.tags = tag
  if (search) {
    // Search across title/excerpt/tags and the linked destination's name/country.
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const dests = await Destination.find({
      published: true,
      $or: [{ name: rx }, { country: rx }],
    })
      .select('_id')
      .lean()
    filter.$or = [
      { title: rx },
      { excerpt: rx },
      { tags: rx },
      ...(dests.length ? [{ destinationId: { $in: dests.map((d) => d._id) } }] : []),
    ]
  }

  const total = await Blog.countDocuments(filter)
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)

  const items = await Blog.find(filter, PUBLIC_PROJECTION)
    .populate('destinationId', DEST_POPULATE)
    .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
    .skip((safePage - 1) * limit)
    .limit(limit)
    .lean()

  const result = {
    items: items.map((d) => toPublicBlog(d)),
    page: safePage,
    limit,
    total,
    totalPages,
  }
  if (destination) {
    const dest = await Destination.findOne({ slug: destination }).select('name slug country').lean()
    result.destination = dest
      ? { id: dest._id.toString(), name: dest.name, slug: dest.slug, country: dest.country }
      : null
  }
  return result
}

export async function getPublishedBySlug(slug) {
  const doc = await Blog.findOne({ slug, published: true }, PUBLIC_PROJECTION)
    .populate('destinationId', DEST_POPULATE)
    .lean()
  if (!doc) return null
  return toPublicBlog(doc, { includeContent: true })
}

// Related blogs: same destination first, then same category/tags, then recent —
// never the current post, always published.
export async function relatedPublished(blog, limit = 3) {
  const base = { published: true, _id: { $ne: blog._id } }
  const sameDest = blog.destinationId
    ? await Blog.find({ ...base, destinationId: blog.destinationId })
        .select(PUBLIC_PROJECTION)
        .populate('destinationId', DEST_POPULATE)
        .sort({ publishedAt: -1 })
        .limit(limit)
        .lean()
    : []
  if (sameDest.length >= limit) return sameDest.map((d) => toPublicBlog(d))

  const exclude = new Set(sameDest.map((d) => d._id.toString()))
  const sameCat = await Blog.find({ ...base, category: blog.category })
    .select(PUBLIC_PROJECTION)
    .populate('destinationId', DEST_POPULATE)
    .sort({ publishedAt: -1 })
    .limit(limit * 2)
    .lean()
  for (const d of sameCat) {
    if (!exclude.has(d._id.toString()) && sameDest.length < limit) {
      sameDest.push(d)
      exclude.add(d._id.toString())
    }
    if (sameDest.length >= limit) break
  }
  if (sameDest.length >= limit) return sameDest.map((d) => toPublicBlog(d))

  const recent = await Blog.find(base)
    .select(PUBLIC_PROJECTION)
    .populate('destinationId', DEST_POPULATE)
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit * 2)
    .lean()
  for (const d of recent) {
    if (!exclude.has(d._id.toString()) && sameDest.length < limit) {
      sameDest.push(d)
      exclude.add(d._id.toString())
    }
    if (sameDest.length >= limit) break
  }
  return sameDest.map((d) => toPublicBlog(d))
}
