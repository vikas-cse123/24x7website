import Destination, { toPublicDestination } from '../models/Destination.js'
import { slugify, ensureUniqueSlug } from '../utils/slugify.js'

const PUBLIC_PROJECTION = '-createdBy -updatedBy -__v'

// --- Public ---------------------------------------------------------------

export async function listPublic({ page = 1, limit = 12, country, category, featured }) {
  const filter = { published: true }
  if (country) filter.country = { $regex: new RegExp(`^${escapeRegex(country)}$`, 'i') }
  if (category) filter.category = category
  if (featured !== undefined) filter.featured = featured

  const total = await Destination.countDocuments(filter)
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)

  const items = await Destination.find(filter, PUBLIC_PROJECTION)
    .sort({ featured: -1, displayOrder: 1, name: 1 })
    .skip((safePage - 1) * limit)
    .limit(limit)
    .lean()

  return {
    items: items.map(toPublicDestination),
    page: safePage,
    limit,
    total,
    totalPages,
  }
}

export async function getPublicBySlug(slug) {
  const doc = await Destination.findOne({ slug, published: true }, PUBLIC_PROJECTION).lean()
  return doc ? toPublicDestination(doc) : null
}

// --- Admin ----------------------------------------------------------------

export async function listAdmin({ page = 1, limit = 20, search, published }) {
  const filter = {}
  if (published !== undefined) filter.published = published
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ name: rx }, { country: rx }]
  }

  const total = await Destination.countDocuments(filter)
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)

  const items = await Destination.find(filter)
    .sort({ updatedAt: -1 })
    .skip((safePage - 1) * limit)
    .limit(limit)
    .lean()

  return {
    items: items.map(toPublicDestination),
    page: safePage,
    limit,
    total,
    totalPages,
  }
}

export async function getAdminById(id) {
  const doc = await Destination.findById(id).lean()
  return doc ? toPublicDestination(doc) : null
}

export async function create(data, userId) {
  const name = data.name.trim()
  let slug = data.slug ? data.slug.trim() : slugify(name)
  if (!slug) slug = 'destination'
  slug = await ensureUniqueSlug(Destination, slug)

  const doc = await Destination.create({
    ...data,
    name,
    slug,
    createdBy: userId,
    updatedBy: userId,
  })
  return toPublicDestination(doc.toObject())
}

export async function update(id, data, userId) {
  const existing = await Destination.findById(id)
  if (!existing) return null

  const updateData = { ...data, updatedBy: userId }
  if (updateData.slug) {
    updateData.slug = updateData.slug.trim()
    updateData.slug = await ensureUniqueSlug(Destination, updateData.slug, id)
  } else {
    // Preserve the existing slug; it is only changed when explicitly provided.
    delete updateData.slug
  }

  Object.assign(existing, updateData)
  await existing.save()
  return toPublicDestination(existing.toObject())
}

export async function remove(id) {
  const doc = await Destination.findByIdAndDelete(id)
  return doc ? toPublicDestination(doc.toObject()) : null
}

export async function setPublished(id, published, userId) {
  const doc = await Destination.findByIdAndUpdate(
    id,
    { published, updatedBy: userId },
    { new: true }
  )
  return doc ? toPublicDestination(doc.toObject()) : null
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}