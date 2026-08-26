import Faq from '../models/Faq.js'
import Destination from '../models/Destination.js'
import Trip from '../models/Trip.js'

function badRequest(message, errors) {
  const err = new Error(message)
  err.status = 400
  if (errors) err.errors = errors
  return err
}
function notFound(message = 'Not found') {
  const err = new Error(message)
  err.status = 404
  return err
}
function conflict(message) {
  const err = new Error(message)
  err.status = 409
  return err
}

// Duplicate guard: same normalised question within the SAME scope.
async function assertNoDuplicate(question, { destinationId, tripId }, excludeId = null) {
  const norm = String(question).trim().toLowerCase().replace(/\s+/g, ' ')
  const filter = {
    $expr: {
      $eq: [
        { $toLower: { $trim: { input: '$question' } } },
        norm,
      ],
    },
    destinationId: destinationId || null,
    tripId: tripId || null,
  }
  if (excludeId) filter._id = { $ne: excludeId }
  const dup = await Faq.exists(filter)
  if (dup) throw conflict('An FAQ with this question already exists in the same scope')
}

function validateRefs({ destinationId, tripId }) {
  return Promise.all([
    destinationId ? Destination.exists({ _id: destinationId }) : Promise.resolve(true),
    tripId ? Trip.exists({ _id: tripId }) : Promise.resolve(true),
  ]).then(([d, t]) => {
    if (!d) throw badRequest('Selected destination does not exist')
    if (!t) throw badRequest('Selected trip does not exist')
  })
}

export function toPublicFaq(doc, options = {}) {
  if (!doc) return null
  return {
    id: doc.id || doc._id?.toString(),
    question: doc.question,
    answer: doc.answer,
    category: doc.category,
    displayOrder: doc.displayOrder,
    ...(options.includeMeta
      ? {
          published: doc.published,
          destinationId: doc.destinationId?.toString?.() ?? null,
          tripId: doc.tripId?.toString?.() ?? null,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        }
      : {}),
    // Scope annotation for merged trip-page rendering.
    ...(options.withScope ? { scope: options.scope } : {}),
  }
}

const ORDER = { displayOrder: 1, createdAt: 1 }

// --- admin -------------------------------------------------------------------

export async function listAdmin({ page = 1, limit = 20, search, scope, published }) {
  const filter = {}
  if (published !== undefined) filter.published = published
  if (scope === 'global') {
    filter.destinationId = null
    filter.tripId = null
  } else if (scope === 'destination') {
    filter.destinationId = { $ne: null }
  } else if (scope === 'trip') {
    filter.tripId = { $ne: null }
  }
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ question: rx }, { answer: rx }]
  }

  const total = await Faq.countDocuments(filter)
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)

  const items = await Faq.find(filter)
    .populate('destinationId', 'name slug')
    .populate('tripId', 'name slug')
    .sort(ORDER)
    .skip((safePage - 1) * limit)
    .limit(limit)
    .lean()

  return {
    items: items.map((d) => toPublicFaq(d, { includeMeta: true })),
    page: safePage,
    limit,
    total,
    totalPages,
  }
}

export async function getAdminById(id) {
  const doc = await Faq.findById(id)
    .populate('destinationId', 'name slug')
    .populate('tripId', 'name slug')
    .lean()
  return doc ? toPublicFaq(doc, { includeMeta: true }) : null
}

export async function create(data) {
  await validateRefs(data)
  await assertNoDuplicate(data.question, data)

  const doc = await Faq.create({
    question: data.question,
    answer: data.answer,
    category: data.category || 'general',
    destinationId: data.destinationId || null,
    tripId: data.tripId || null,
    displayOrder: data.displayOrder ?? 0,
    published: data.published ?? false,
  })

  return toPublicFaq(doc.toObject(), { includeMeta: true })
}

export async function update(id, data) {
  const existing = await Faq.findById(id)
  if (!existing) return null

  const merged = {
    question: data.question ?? existing.question,
    answer: data.answer ?? existing.answer,
    destinationId: data.destinationId !== undefined ? data.destinationId : existing.destinationId?.toString() ?? null,
    tripId: data.tripId !== undefined ? data.tripId : existing.tripId?.toString() ?? null,
  }
  if (merged.destinationId && merged.tripId) {
    throw badRequest('An FAQ can belong to a destination or a trip — not both', [
      { path: 'tripId', message: 'An FAQ can belong to a destination or a trip — not both' },
    ])
  }
  await validateRefs(merged)
  await assertNoDuplicate(merged.question, merged, id)

  const patch = { ...data }
  delete patch.__nothing
  if (patch.question !== undefined) existing.question = patch.question
  if (patch.answer !== undefined) existing.answer = patch.answer
  if (patch.category !== undefined) existing.category = patch.category
  if (data.destinationId !== undefined) existing.destinationId = data.destinationId || null
  if (data.tripId !== undefined) existing.tripId = data.tripId || null
  if (patch.displayOrder !== undefined) existing.displayOrder = patch.displayOrder
  if (patch.published !== undefined) existing.published = patch.published

  await existing.save()
  const populated = await Faq.findById(existing._id)
    .populate('destinationId', 'name slug')
    .populate('tripId', 'name slug')
    .lean()
  return toPublicFaq(populated, { includeMeta: true })
}

export async function remove(id) {
  const doc = await Faq.findByIdAndDelete(id).lean()
  if (!doc) return null
  return { id: doc._id.toString(), deleted: true }
}

export async function setPublished(id, published) {
  const doc = await Faq.findByIdAndUpdate(id, { published }, { new: true })
  if (!doc) return null
  return toPublicFaq(doc.toObject(), { includeMeta: true })
}

// Bulk reorder — applies each {id, displayOrder} sequentially.
export async function reorder(items) {
  let updated = 0
  for (const item of items) {
    const r = await Faq.updateOne({ _id: item.id }, { displayOrder: item.displayOrder })
    updated += r.modifiedCount
  }
  return { updated }
}

// --- public -------------------------------------------------------------------

export async function listPublishedGlobal(limit = 20) {
  const docs = await Faq.find({ published: true, destinationId: null, tripId: null })
    .sort(ORDER)
    .limit(limit)
    .lean()
  return docs.map((d) => toPublicFaq(d))
}

export async function listPublishedForDestination(destinationSlug) {
  const dest = await Destination.findOne({ slug: destinationSlug, published: true })
    .select('_id name slug country')
    .lean()
  if (!dest) return null
  const docs = await Faq.find({ published: true, destinationId: dest._id })
    .sort(ORDER)
    .limit(50)
    .lean()
  return {
    destination: { id: dest._id.toString(), name: dest.name, slug: dest.slug, country: dest.country },
    items: docs.map((d) => toPublicFaq(d)),
  }
}

export async function listPublishedForTrip(tripSlug) {
  const trip = await Trip.findOne({ slug: tripSlug, published: true })
    .select('_id name slug destinationId')
    .populate('destinationId', 'name slug country')
    .lean()
  if (!trip) return null

  // Priority: trip-specific → its destination → global. Deduplicate by
  // normalised question; annotate each item with its scope.
  const seen = new Set()
  const dedupe = (docs, scope) =>
    docs
      .map((d) => toPublicFaq(d, { withScope: true, scope }))
      .filter((f) => {
        const key = f.question.trim().toLowerCase().replace(/\s+/g, ' ')
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

  const tripFaqs = dedupe(
    await Faq.find({ published: true, tripId: trip._id }).sort(ORDER).limit(50).lean(),
    'trip'
  )
  for (const f of tripFaqs) seen.add(f.question.trim().toLowerCase())

  const destFaqs = trip.destinationId
    ? dedupe(
        await Faq.find({
          published: true,
          destinationId: trip.destinationId._id || trip.destinationId,
          tripId: null,
        })
          .sort(ORDER)
          .limit(50)
          .lean(),
        'destination'
      )
    : []
  for (const f of destFaqs) seen.add(f.question.trim().toLowerCase())

  const globalFaqs = dedupe(
    await Faq.find({ published: true, destinationId: null, tripId: null })
      .sort(ORDER)
      .limit(50)
      .lean(),
    'global'
  )

  return {
    trip: { id: trip._id.toString(), name: trip.name, slug: trip.slug },
    destination: trip.destinationId && typeof trip.destinationId === 'object'
      ? { id: trip.destinationId._id?.toString(), name: trip.destinationId.name, slug: trip.destinationId.slug }
      : null,
    tripFaqs,
    destinationFaqs: destFaqs,
    globalFaqs,
    // Flat list already in priority order.
    items: [...tripFaqs, ...destFaqs, ...globalFaqs],
  }
}
