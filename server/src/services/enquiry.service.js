import Enquiry from '../models/Enquiry.js'
import Destination from '../models/Destination.js'

function notFound(message = 'Not found') {
  const err = new Error(message)
  err.status = 404
  return err
}

const DEST_POPULATE = 'name slug country'

export function toPublicEnquiry(doc, options = {}) {
  // destinationId is either a populated document ({_id,name,slug,country}) or a
  // raw ObjectId. Only treat it as populated when it carries the destination
  // shape; otherwise expose the id + snapshot name.
  const dest =
    doc.destinationId && typeof doc.destinationId === 'object' && doc.destinationId.name
      ? doc.destinationId
      : null
  return {
    id: doc.id || doc._id?.toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    countryCode: doc.countryCode,
    destinationId: dest ? dest._id?.toString?.() || dest.id : doc.destinationId?.toString?.() ?? null,
    destination: dest
      ? {
          id: dest._id?.toString?.() || dest.id,
          name: dest.name,
          slug: dest.slug,
          country: dest.country,
        }
      : null,
    destinationName: doc.destinationName,
    source: doc.source,
    message: doc.message,
    status: doc.status,
    // Attribution is admin-only — never exposed in the public creation response.
    ...(options.includeMeta ? { userId: doc.userId?.toString?.() ?? null } : {}),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

// --- public ----------------------------------------------------------------

// Create an enquiry from a website visitor (no auth required). The destination
// is validated to exist and be PUBLISHED so drafts/admin-only records can never
// be referenced. `destinationName` is snapshotted for admin display even if the
// destination is later unpublished/renamed.
export async function createPublic(data, userId = null) {
  let dest = null
  if (data.destinationId) {
    dest = await Destination.findOne({ _id: data.destinationId, published: true })
      .select('name slug country')
      .lean()
    if (!dest) {
      const err = new Error('Selected destination is not available')
      err.status = 400
      err.errors = [{ path: 'destinationId', message: 'Please select a valid destination' }]
      throw err
    }
  }

  const doc = await Enquiry.create({
    name: data.name,
    email: data.email || '',
    phone: data.phone,
    countryCode: data.countryCode || '+91',
    destinationId: dest?._id || null,
    destinationName: dest?.name || data.destinationName || '',
    source: data.source || 'website',
    message: data.message || '',
    status: 'new',
    userId,
  })

  return toPublicEnquiry(doc.toObject())
}

// --- admin (requireAuth + requireRole(admin) enforced at the router) -------

export async function listAdmin({ page = 1, limit = 20, status, source, search }) {
  const filter = {}
  if (status) filter.status = status
  if (source) filter.source = source
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [
      { name: rx },
      { email: rx },
      { phone: rx },
      { destinationName: rx },
    ]
  }

  const total = await Enquiry.countDocuments(filter)
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)

  const items = await Enquiry.find(filter)
    .populate('destinationId', DEST_POPULATE)
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * limit)
    .limit(limit)
    .lean()

  return {
    items: items.map((e) => toPublicEnquiry(e, { includeMeta: true })),
    page: safePage,
    limit,
    total,
    totalPages,
  }
}

export async function getAdminById(id) {
  const doc = await Enquiry.findById(id).populate('destinationId', DEST_POPULATE).lean()
  return doc ? toPublicEnquiry(doc, { includeMeta: true }) : null
}

export async function setStatus(id, status) {
  const doc = await Enquiry.findByIdAndUpdate(id, { status }, { new: true })
    .populate('destinationId', DEST_POPULATE)
    .lean()
  return doc ? toPublicEnquiry(doc, { includeMeta: true }) : null
}

export async function remove(id) {
  const doc = await Enquiry.findByIdAndDelete(id).lean()
  if (!doc) return null
  return { id: doc._id.toString(), deleted: true }
}

export { notFound }