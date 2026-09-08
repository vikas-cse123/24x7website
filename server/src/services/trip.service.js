import Trip, { toPublicTrip, toAdminTrip } from '../models/Trip.js'
import TripBatch from '../models/TripBatch.js'
import TripMedia from '../models/TripMedia.js'
import Destination from '../models/Destination.js'
import { slugify, ensureUniqueSlug } from '../utils/slugify.js'
import {
  attachUpcomingBatches,
  publicVisibilityFilter,
} from './tripBatch.service.js'
import { ratingSummary } from './review.service.js'
import * as imageStorage from './imageStorage.service.js'

const PUBLIC_PROJECTION = '-createdBy -updatedBy -__v'
const DEST_POPULATE = 'name slug country heroImage heroVideo'

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function badRequest(message) {
  const err = new Error(message)
  err.status = 400
  return err
}

async function ensureDestinationExists(destinationId) {
  const exists = await Destination.exists({ _id: destinationId })
  if (!exists) {
    throw badRequest('Destination does not exist')
  }
}

// Human-readable, unique, server-generated trip code (e.g. TRP-000001).
async function generateTripCode() {
  const last = await Trip.find({ tripCode: /^TRP-\d+$/ })
    .select('tripCode')
    .sort({ tripCode: -1 })
    .limit(1)
    .lean()
  let next = 1
  if (last.length > 0) {
    const match = /^TRP-(\d+)$/.exec(last[0].tripCode)
    if (match) next = Number(match[1]) + 1
  }
  return `TRP-${String(next).padStart(6, '0')}`
}

// --- Public ---------------------------------------------------------------

function emptyPage(page, limit) {
  return { items: [], page, limit, total: 0, totalPages: 1 }
}

export async function listPublic({
  page = 1,
  limit = 12,
  search,
  destination,
  tripType,
  category,
  featured,
  minPrice,
  maxPrice,
  departureDate,
  departureFrom,
  departureTo,
  sort = 'recommended',
  includeBatches,
}) {
  const filter = { published: true }

  // --- resolve destination-scoped filters ---------------------------------
  if (destination) {
    const dest = await Destination.findOne({ slug: destination, published: true }).select('_id').lean()
    if (!dest) return emptyPage(page, limit)
    filter.destinationId = dest._id
  }
  if (category) {
    // Domestic/International/etc. resolve through Destination.category — the
    // single source of truth; no duplicated market data on Trip.
    const destIds = await Destination.find({ published: true, category }).select('_id').lean()
    if (destIds.length === 0) return emptyPage(page, limit)
    filter.destinationId = { $in: destIds.map((d) => d._id) }
  }
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i')
    const destIds = await Destination.find({ published: true, $or: [{ name: rx }, { country: rx }] })
      .select('_id')
      .lean()
    filter.$or = [
      { name: rx },
      { tripCode: rx },
      { destinationId: { $in: destIds.map((d) => d._id) } },
    ]
  }
  if (tripType) filter.tripType = tripType
  if (featured !== undefined) filter.featured = featured

  // --- batch-dependent filters/sorting ------------------------------------
  // Budget and departure-date filters are resolved against upcoming PUBLIC
  // batches (published, open/full, future). One aggregation groups qualifying
  // batches per trip (cheapest + soonest); a trip matches when it has at least
  // one qualifying batch. No N+1 and no full-collection hydration.
  const batchDatePriceFilter = {}
  if (minPrice !== undefined || maxPrice !== undefined) {
    batchDatePriceFilter.price = {}
    if (minPrice !== undefined) batchDatePriceFilter.price.$gte = minPrice
    if (maxPrice !== undefined) batchDatePriceFilter.price.$lte = maxPrice
  }
  if (departureDate || departureFrom || departureTo) {
    if (departureDate) {
      // Exact calendar day (UTC-midnight stored dates).
      const day = new Date(`${departureDate}T00:00:00Z`)
      batchDatePriceFilter.departureDate = { $gte: day, $lt: new Date(day.getTime() + 86400000) }
    } else {
      batchDatePriceFilter.departureDate = {}
      if (departureFrom) batchDatePriceFilter.departureDate.$gte = new Date(`${departureFrom}T00:00:00Z`)
      if (departureTo) batchDatePriceFilter.departureDate.$lte = new Date(`${departureTo}T00:00:00Z`)
    }
  }

  const hasBatchFilters = Object.keys(batchDatePriceFilter).length > 0
  const sortsByBatch = sort === 'price_asc' || sort === 'price_desc' || sort === 'departure_asc'

  let batchMap = null // tripId -> { cheapest, minDeparture, count }
  if (hasBatchFilters || sortsByBatch) {
    const rows = await TripBatch.aggregate([
      { $match: publicVisibilityFilter(batchDatePriceFilter) },
      { $sort: { price: 1, departureDate: 1 } },
      {
        $group: {
          _id: '$tripId',
          cheapest: { $first: '$$ROOT' },
          minDeparture: { $min: '$departureDate' },
          count: { $sum: 1 },
        },
      },
    ])
    batchMap = new Map(rows.map((r) => [r._id.toString(), r]))
    if (hasBatchFilters) {
      const qualifyingIds = [...batchMap.keys()]
      // Price-based filtering must also consider trips with no upcoming public batches:
      // their display price is Trip.startingPrice. Without this, Europe (startingPrice 103k, 0 batches)
      // disappears when filtering minPrice=75000.
      if (batchDatePriceFilter.price) {
        const priceRange = batchDatePriceFilter.price
        // All trips that have at least one upcoming public batch (any price) — these are already
        // represented by batchMap (which is price-filtered). Fallback should only apply to trips with no batches.
        const allPublicTripIds = await TripBatch.distinct('tripId', publicVisibilityFilter({}))
        const baseFilterForFallback = { ...filter }
        const fallbackFilter = {
          ...baseFilterForFallback,
          _id: { $nin: allPublicTripIds },
          startingPrice: priceRange,
        }
        // Ensure we don't match trips with null startingPrice when filtering by price
        const fallbackIds = (await Trip.distinct('_id', fallbackFilter)).map((id) => id.toString())
        const combinedIds = [...new Set([...qualifyingIds, ...fallbackIds])]
        if (combinedIds.length === 0) return emptyPage(page, limit)
        filter._id = { $in: combinedIds }
      } else {
        if (qualifyingIds.length === 0) return emptyPage(page, limit)
        filter._id = { $in: qualifyingIds }
      }
    }
  }

  // --- fetch + paginate ----------------------------------------------------
  let items
  let total
  let pageOut
  let totalPagesOut

  if (!sortsByBatch) {
    // Fast path — unchanged behaviour for existing callers.
    total = await Trip.countDocuments(filter)
    totalPagesOut = Math.max(1, Math.ceil(total / limit))
    pageOut = Math.min(page, totalPagesOut)
    items = await Trip.find(filter, PUBLIC_PROJECTION)
      .populate('destinationId', DEST_POPULATE)
      .sort({ featured: -1, displayOrder: 1, name: 1 })
      .skip((pageOut - 1) * limit)
      .limit(limit)
      .lean()
  } else {
    // Batch-aware path: lightweight docs for ordering, paginate in memory,
    // hydrate only the current page with the public projection. Trips without
    // upcoming batches sort last (they are only EXCLUDED by actual filters).
    const lightDocs = await Trip.find(filter)
      .select('_id featured displayOrder name')
      .lean()
    total = lightDocs.length
    totalPagesOut = Math.max(1, Math.ceil(total / limit))
    pageOut = Math.min(page, totalPagesOut)

    const keyOf = (doc) => doc._id.toString()
    const priceOf = (doc) => batchMap?.get(keyOf(doc))?.cheapest?.price ?? Number.POSITIVE_INFINITY
    const departOf = (doc) => batchMap?.get(keyOf(doc))?.minDeparture?.getTime() ?? Number.MAX_SAFE_INTEGER
    // Recommended order doubles as the stable tie-break for every sort.
    const recommendedCompare = (a, b) =>
      (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
      (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
      String(a.name).localeCompare(String(b.name))

    lightDocs.sort((a, b) => {
      switch (sort) {
        case 'price_asc':
          return priceOf(a) - priceOf(b) || recommendedCompare(a, b)
        case 'price_desc':
          return priceOf(b) - priceOf(a) || recommendedCompare(a, b)
        case 'departure_asc':
          return departOf(a) - departOf(b) || recommendedCompare(a, b)
        default:
          return recommendedCompare(a, b)
      }
    })

    const pageDocs = lightDocs.slice((pageOut - 1) * limit, pageOut * limit)
    const pageIds = pageDocs.map((d) => d._id)
    const hydrated = await Trip.find({ _id: { $in: pageIds } }, PUBLIC_PROJECTION)
      .populate('destinationId', DEST_POPULATE)
      .lean()
    const byId = new Map(hydrated.map((d) => [d._id.toString(), d]))
    items = pageIds.map((id) => byId.get(id.toString())).filter(Boolean)
  }

  // --- assemble response ----------------------------------------------------
  const result = {
    items: items.map(toPublicTrip),
    page: pageOut,
    limit,
    total,
    totalPages: totalPagesOut,
  }

  // Derived per-trip pricing summary from the cheapest upcoming public batch.
  if (batchMap) {
    result.items = result.items.map((trip) => {
      const entry = batchMap.get(trip.id)
      if (!entry) return trip
      const cheapest = entry.cheapest
      const hasDiscount =
        cheapest.originalPrice != null && Number(cheapest.originalPrice) > Number(cheapest.price)
      return {
        ...trip,
        pricingSummary: {
          price: cheapest.price,
          originalPrice: hasDiscount ? cheapest.originalPrice : null,
          discountAmount: hasDiscount ? cheapest.originalPrice - cheapest.price : null,
          currency: cheapest.currency || trip.currency || 'INR',
          soonestDeparture: entry.minDeparture,
          upcomingCount: entry.count,
        },
      }
    })
  }

  // Optional: embed upcoming public departures per trip (discovery/homepage
  // cards). Active date/price filters constrain which departures cards show.
  if (includeBatches === true || includeBatches === 'true') {
    result.items = await attachUpcomingBatches(result.items, 5, batchDatePriceFilter)
  }

  // Rating summary (approved reviews) per item — single aggregation.
  const summaries = await ratingSummary(result.items.map((t) => t.id))
  if (summaries.length > 0) {
    result.items = result.items.map((t) => ({
      ...t,
      ratingSummary: summaries.find((x) => x.tripId === t.id) || null,
    }))
  }

  return result
}

export async function getPublicBySlug(slug) {
  const doc = await Trip.findOne({ slug, published: true }, PUBLIC_PROJECTION)
    .populate('destinationId', DEST_POPULATE)
    .lean()
  if (!doc) return null
  const trip = toPublicTrip(doc)
  const summaries = await ratingSummary([trip.id])
  trip.ratingSummary = summaries[0] || null
  return trip
}

// --- Admin ----------------------------------------------------------------

export async function listAdmin({ page = 1, limit = 20, search, destinationId, tripType, published }) {
  const filter = {}
  if (destinationId) filter.destinationId = destinationId
  if (tripType) filter.tripType = tripType
  if (published !== undefined) filter.published = published
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i')
    const or = [{ name: rx }, { slug: rx }, { tripCode: rx }, { cardName: rx }, { pageHeading: rx }]
    // Also match destination name/country/slug
    const destIds = await Destination.find({ $or: [{ name: rx }, { country: rx }, { slug: rx }] })
      .select('_id')
      .lean()
    if (destIds.length) or.push({ destinationId: { $in: destIds.map((d) => d._id) } })
    filter.$or = or
  }

  const total = await Trip.countDocuments(filter)
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)

  const items = await Trip.find(filter)
    .populate('destinationId', DEST_POPULATE)
    .sort({ updatedAt: -1 })
    .skip((safePage - 1) * limit)
    .limit(limit)
    .lean()

  return {
    items: items.map(toAdminTrip),
    page: safePage,
    limit,
    total,
    totalPages,
  }
}

export async function getAdminById(id) {
  const doc = await Trip.findById(id).populate('destinationId', DEST_POPULATE).lean()
  return doc ? toAdminTrip(doc) : null
}

export async function create(data, userId) {
  await ensureDestinationExists(data.destinationId)

  const name = data.name.trim()
  let slug = data.slug ? data.slug.trim() : slugify(name)
  if (!slug) slug = 'trip'
  slug = await ensureUniqueSlug(Trip, slug)

  const tripCode = await generateTripCode()

  const doc = await Trip.create({
    ...data,
    name,
    slug,
    tripCode,
    createdBy: userId,
    updatedBy: userId,
  })

  return toAdminTrip(await doc.populate('destinationId', DEST_POPULATE))
}

export async function update(id, data, userId) {
  const existing = await Trip.findById(id)
  if (!existing) return null

  if (data.destinationId) {
    await ensureDestinationExists(data.destinationId)
  }

  const updateData = { ...data, updatedBy: userId }
  // tripCode is server-controlled and never editable by clients.
  delete updateData.tripCode

  if (updateData.slug) {
    updateData.slug = updateData.slug.trim()
    updateData.slug = await ensureUniqueSlug(Trip, updateData.slug, id)
  } else {
    // Preserve the existing slug; it only changes when explicitly provided.
    delete updateData.slug
  }

  const keysBefore = imageStorage.collectKeys(existing.toObject())
  Object.assign(existing, updateData)
  await existing.save()

  // Delete S3 images that were removed/replaced by this update.
  // Reference-aware: objects still referenced by other records are skipped.
  const staleKeys = imageStorage.removedKeys(keysBefore, existing.toObject())
  await imageStorage.cleanupUnreferenced(staleKeys, `Trip ${id} update`)

  return toAdminTrip(await existing.populate('destinationId', DEST_POPULATE))
}

export async function remove(id) {
  const doc = await Trip.findById(id)
  if (!doc) return null
  if (doc.published) {
    throw badRequest('Unpublish this trip before deleting it')
  }

  // Capture ALL S3 media owned by the trip BEFORE deleting anything:
  // the trip's own hero/gallery plus its dependent trip-media records.
  const mediaDocs = await TripMedia.find({ tripId: doc._id }).select('publicId url secureUrl').lean()
  const keys = [
    ...imageStorage.collectKeys(doc.toObject()),
    ...mediaDocs.flatMap((m) => imageStorage.collectKeys(m)),
  ]

  // Delete dependent records, then the trip itself. DB first — S3 cleanup
  // runs afterwards and never rolls the deletion back.
  await TripMedia.deleteMany({ tripId: doc._id })
  await doc.deleteOne()

  // Reference-aware cleanup: objects still referenced by any remaining
  // record anywhere in the database are skipped.
  await imageStorage.cleanupUnreferenced(keys, `Trip ${id} delete`)
  return toAdminTrip(doc.toObject())
}

export async function setPublished(id, published, userId) {
  const doc = await Trip.findByIdAndUpdate(
    id,
    { published, updatedBy: userId },
    { new: true }
  )
  return doc ? toAdminTrip(await doc.populate('destinationId', DEST_POPULATE)) : null
}