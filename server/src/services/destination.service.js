import Destination, { toPublicDestination } from '../models/Destination.js'
import { slugify, ensureUniqueSlug } from '../utils/slugify.js'
import * as imageStorage from './imageStorage.service.js'

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

export async function listAdmin({ page = 1, limit = 20, search, published, category }) {
  const filter = {}
  if (published !== undefined) filter.published = published
  if (category) filter.category = category
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
  // Client-reported keys uploaded during this form session (before save).
  // Used to garbage-collect uploads the admin removed before saving.
  // Server-controlled: never persisted to the document.
  const { sessionUploadKeys, ...persistData } = data

  const name = persistData.name.trim()
  let slug = persistData.slug ? persistData.slug.trim() : slugify(name)
  if (!slug) slug = 'destination'
  slug = await ensureUniqueSlug(Destination, slug)

  const doc = await Destination.create({
    ...persistData,
    name,
    slug,
    createdBy: userId,
    updatedBy: userId,
  })

  // DB is saved — now clean up uploads that did not make it into the
  // destination (removed in the UI before saving). Reference-aware: keys
  // still used by any other record are skipped.
  const savedKeys = imageStorage.collectKeys(doc.toObject())
  const droppedKeys = [...new Set(sessionUploadKeys || [])].filter((key) => !savedKeys.includes(key))
  await imageStorage.cleanupUnreferenced(droppedKeys, `Destination ${doc._id} create`)

  return toPublicDestination(doc.toObject())
}

export async function update(id, data, userId) {
  const { sessionUploadKeys, ...persistData } = data
  const existing = await Destination.findById(id)
  if (!existing) return null

  const updateData = { ...persistData, updatedBy: userId }
  if (updateData.slug) {
    updateData.slug = updateData.slug.trim()
    updateData.slug = await ensureUniqueSlug(Destination, updateData.slug, id)
  } else {
    // Preserve the existing slug; it is only changed when explicitly provided.
    delete updateData.slug
  }

  const keysBefore = imageStorage.collectKeys(existing.toObject())
  Object.assign(existing, updateData)
  await existing.save()

  // DB is saved — now clean up S3 objects that are no longer referenced by
  // this destination. Candidates are the UNION of:
  //   - previously saved media removed/replaced by this update, and
  //   - media uploaded during this form session but removed before saving.
  // Each candidate is deleted only if NO other document references it.
  const keysAfter = imageStorage.collectKeys(existing.toObject())
  const afterSet = new Set(keysAfter)
  const removed = imageStorage.removedKeys(keysBefore, keysAfter)
  const droppedSession = [...new Set(sessionUploadKeys || [])].filter((key) => !afterSet.has(key))
  const candidates = [...new Set([...removed, ...droppedSession])]
  await imageStorage.cleanupUnreferenced(candidates, `Destination ${id} update`)

  return toPublicDestination(existing.toObject())
}

export async function remove(id) {
  const doc = await Destination.findByIdAndDelete(id)
  if (!doc) return null
  // DB is saved (deleted) — clean up the destination's hero + gallery media.
  // Reference-aware: an object shared with another record is skipped.
  await imageStorage.cleanupUnreferenced(
    imageStorage.collectKeys(doc.toObject()),
    `Destination ${id} delete`
  )
  return toPublicDestination(doc.toObject())
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