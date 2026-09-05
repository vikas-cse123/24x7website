import TripBatch, {
  toPublicTripBatch,
  computeAvailableSeats,
} from '../models/TripBatch.js'
import Trip from '../models/Trip.js'
import { assertBatchRules } from '../validators/tripBatch.validator.js'
import Booking from '../models/Booking.js'
import * as notif from './notification.service.js'
import * as imageStorage from './imageStorage.service.js'

const TRIP_POPULATE = {
  path: 'tripId',
  select: 'name slug tripCode destinationId durationDays durationNights startingPrice currency',
  populate: { path: 'destinationId', select: 'name slug country' },
}

function badRequest(message, errors) {
  const err = new Error(message)
  err.status = 400
  if (errors) err.errors = errors
  return err
}

// Human-readable, unique, server-generated batch code (e.g. BAT-000001).
async function generateBatchCode() {
  const last = await TripBatch.find({ batchCode: /^BAT-\d+$/ })
    .select('batchCode')
    .sort({ batchCode: -1 })
    .limit(1)
    .lean()
  let next = 1
  if (last.length > 0) {
    const match = /^BAT-(\d+)$/.exec(last[0].batchCode)
    if (match) next = Number(match[1]) + 1
  }
  const candidate = `BAT-${String(next).padStart(6, '0')}`
  // Guard against collisions from concurrent creates or gaps in numbering.
  if (!(await TripBatch.exists({ batchCode: candidate }))) return candidate
  let n = next + 1
  for (;;) {
    const code = `BAT-${String(n).padStart(6, '0')}`
    if (!(await TripBatch.exists({ batchCode: code }))) return code
    n += 1
  }
}

async function ensureTripExists(tripId) {
  const exists = await Trip.exists({ _id: tripId })
  if (!exists) throw badRequest('Trip does not exist')
}

// UTC midnight of "today" — matches how date-only values are stored, so a
// departure on a past day is always strictly before this boundary.
export function startOfTodayUtc() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

// Public visibility is enforced HERE (never left to the client):
// published + status open/full + departure strictly in the future.
export function publicVisibilityFilter(extra = {}) {
  return {
    published: true,
    status: { $in: ['open', 'full'] },
    departureDate: { $gt: startOfTodayUtc() },
    ...extra,
  }
}

// --- Admin ----------------------------------------------------------------

export async function listAdmin({ page = 1, limit = 20, search, tripId, status, published }) {
  const filter = {}
  if (tripId) filter.tripId = tripId
  if (status) filter.status = status
  if (published !== undefined) filter.published = published

  let query = TripBatch.find(filter)
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const trips = await Trip.find({ $or: [{ name: rx }, { tripCode: rx }] }).select('_id').lean()
    filter.$or = [{ batchCode: rx }, { tripId: { $in: trips.map((t) => t._id) } }]
    query = TripBatch.find(filter)
  }

  const total = await TripBatch.countDocuments(filter)
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)

  const items = await query
    .populate(TRIP_POPULATE)
    .sort({ updatedAt: -1 })
    .skip((safePage - 1) * limit)
    .limit(limit)
    .lean()

  return {
    items: items.map((doc) => toPublicTripBatch(doc, { includeNotes: true })),
    page: safePage,
    limit,
    total,
    totalPages,
  }
}

export async function getAdminById(id) {
  const doc = await TripBatch.findById(id).populate(TRIP_POPULATE).lean()
  return doc ? toPublicTripBatch(doc, { includeNotes: true }) : null
}

export async function create(data, userId) {
  await ensureTripExists(data.tripId)
  assertBatchRules(data)

  const batchCode = await generateBatchCode()
  const doc = await TripBatch.create({
    ...data,
    batchCode,
    createdBy: userId,
    updatedBy: userId,
  })

  return toPublicTripBatch(await doc.populate(TRIP_POPULATE), { includeNotes: true })
}

export async function update(id, data, userId) {
  const existing = await TripBatch.findById(id)
  if (!existing) return null

  // Server-controlled fields are never client-editable.
  const patch = { ...data }
  delete patch.batchCode
  delete patch.createdBy
  delete patch.updatedBy

  const merged = {
    ...existing.toObject(),
    ...patch,
  }
  if (patch.tripId && String(patch.tripId) !== String(existing.tripId)) {
    await ensureTripExists(patch.tripId)
  }
  assertBatchRules(merged)

  const departureChanged = patch.departureDate && existing.departureDate &&
    new Date(patch.departureDate).getTime() !== new Date(existing.departureDate).getTime()

  Object.assign(existing, patch, { updatedBy: userId })
  await existing.save()

  if (departureChanged) {
    // Notify only users with bookings on this batch
    const booked = await Booking.find({ tripBatchId: existing._id, status: { $nin: ['cancelled'] } }).select('userId').lean()
    const tripName = (await Trip.findById(existing.tripId).select('name').lean())?.name
    for (const b of booked) {
      notif.createTripNotification(b.userId, {
        event:'departure_changed', batch: existing, tripName, departureDate: patch.departureDate,
      }).catch(()=>{})
    }
  }

  return toPublicTripBatch(await existing.populate(TRIP_POPULATE), { includeNotes: true })
}

export async function remove(id) {
  const doc = await TripBatch.findById(id)
  if (!doc) return null
  // Future Booking records will reference batches; never cascade-delete.
  if ((Number(doc.bookedSeats) || 0) > 0) {
    throw badRequest('This batch has booked seats and cannot be deleted')
  }
  // Batches currently own no media fields, so `keys` is empty today — but
  // running the centralized reference-aware cleanup here means any S3-backed
  // media added to the batch schema later is cleaned up automatically.
  const keys = imageStorage.collectKeys(doc.toObject())
  await doc.deleteOne()
  await imageStorage.cleanupUnreferenced(keys, `TripBatch ${id} delete`)
  return toPublicTripBatch(doc.toObject(), { includeNotes: true })
}

export async function setPublished(id, published, userId) {
  const doc = await TripBatch.findByIdAndUpdate(id, { published, updatedBy: userId }, { new: true })
  return doc ? toPublicTripBatch(await doc.populate(TRIP_POPULATE), { includeNotes: true }) : null
}

export async function setStatus(id, status, userId) {
  const doc = await TripBatch.findById(id)
  if (!doc) return null
  const becameCancelled = status === 'cancelled' && doc.status !== 'cancelled'
  doc.status = status
  doc.updatedBy = userId
  await doc.save()

  if (becameCancelled) {
    const booked = await Booking.find({ tripBatchId: doc._id, status: { $nin: ['cancelled'] } }).select('userId').lean()
    const tripName = (await Trip.findById(doc.tripId).select('name').lean())?.name
    for (const b of booked) {
      notif.createTripNotification(b.userId, { event:'batch_cancelled', batch: doc, tripName, departureDate: doc.departureDate }).catch(()=>{})
    }
  }

  return toPublicTripBatch(await doc.populate(TRIP_POPULATE), { includeNotes: true })
}

// --- Public ---------------------------------------------------------------

// Returns null when the trip does not exist or is not published.
export async function listPublicByTrip(tripId) {
  const trip = await Trip.findOne({ _id: tripId, published: true })
    .select('_id')
    .lean()
  if (!trip) return null

  const docs = await TripBatch.find(publicVisibilityFilter({ tripId }))
    .sort({ departureDate: 1 })
    .lean()

  return docs.map((doc) => toPublicTripBatch(doc))
}

// Homepage/discovery helper: attaches up to `perTrip` upcoming public
// departures to each trip item so cards can show real dates/prices without
// N+1 client requests. `extraMatch` (date/price constraints) narrows which
// departures qualify — used when discovery filters are active.
export async function attachUpcomingBatches(tripItems, perTrip = 5, extraMatch = {}) {
  if (!Array.isArray(tripItems) || tripItems.length === 0) return tripItems
  const ids = tripItems.map((t) => t.id)
  const docs = await TripBatch.find(publicVisibilityFilter({ tripId: { $in: ids }, ...extraMatch }))
    .sort({ departureDate: 1 })
    .select('tripId departureDate returnDate price originalPrice currency totalSeats bookedSeats status')
    .limit(1000)
    .lean()

  const byTrip = new Map()
  for (const doc of docs) {
    const key = doc.tripId.toString()
    const list = byTrip.get(key) || []
    if (list.length < perTrip) {
      list.push(toPublicTripBatch(doc))
      byTrip.set(key, list)
    }
  }

  return tripItems.map((trip) => ({
    ...trip,
    batches: byTrip.get(trip.id) || [],
  }))
}
