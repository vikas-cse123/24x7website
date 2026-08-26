import mongoose from 'mongoose'
import Review, { REVIEW_STATUSES } from '../models/Review.js'
import Booking from '../models/Booking.js'
import Trip from '../models/Trip.js'
import { startOfTodayUtc } from './tripBatch.service.js'
import * as notif from './notification.service.js'

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

// A booking qualifies a user to review a trip only when it is CONFIRMED or
// COMPLETED. Pending / payment_pending (not paid yet) and cancelled bookings
// are not eligible. See ADR-019.
const ELIGIBLE_BOOKING_STATUSES = ['confirmed', 'completed']

const USER_POPULATE = { path: 'userId', select: 'name' }

export function toPublicReview(doc, options = {}) {
  if (!doc) return null
  const user = doc.userId && typeof doc.userId === 'object' ? doc.userId : null
  return {
    id: doc.id || doc._id?.toString(),
    tripId: doc.tripId?.toString?.() ?? doc.tripId,
    rating: doc.rating,
    title: doc.title,
    text: doc.text,
    status: options.includeStatus ? doc.status : undefined,
    travellerName: doc.travellerName,
    batchDepartureDate: doc.batchDepartureDate ?? null,
    createdAt: doc.createdAt,
    authorName: user?.name || doc.travellerName || 'Traveller',
    ...(options.includeBookingId ? { bookingId: doc.bookingId?.toString?.() } : {}),
  }
}

async function findValidBooking(userId, tripId) {
  return Booking.findOne({
    userId,
    tripId,
    status: { $in: ELIGIBLE_BOOKING_STATUSES },
  })
    .sort({ createdAt: -1 })
    .lean()
}

// --- public ----------------------------------------------------------------

// Rating summary for one trip (or a set of trip ids): average, total, and the
// 1–5 distribution — computed over APPROVED reviews in a single aggregation.
export async function ratingSummary(tripIds) {
  const idsArray = Array.isArray(tripIds) ? tripIds : [tripIds]
  if (!idsArray.length) return []
  // Aggregation $match does NOT cast strings — normalise to ObjectIds.
  const oids = idsArray.map((id) => new mongoose.Types.ObjectId(String(id)))
  const rows = await Review.aggregate([
    { $match: { status: 'approved', tripId: { $in: oids } } },
    {
      $group: {
        _id: '$tripId',
        total: { $sum: 1 },
        average: { $avg: '$rating' },
        r1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        r2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        r3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        r4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        r5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
      },
    },
  ])
  return rows.map((r) => ({
    tripId: r._id.toString(),
    total: r.total,
    average: Math.round(r.average * 10) / 10,
    distribution: { 1: r.r1, 2: r.r2, 3: r.r3, 4: r.r4, 5: r.r5 },
  }))
}

export function summaryForTrip(summaries, tripId) {
  const s = summaries.find((x) => x.tripId === String(tripId))
  return (
    s || {
      tripId: String(tripId),
      total: 0,
      average: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    }
  )
}

export async function listPublicByTrip(slugOrId, { page = 1, limit = 6 }) {
  const query = /^[0-9a-fA-F]{24}$/.test(String(slugOrId))
    ? { _id: slugOrId }
    : { slug: slugOrId }
  const trip = await Trip.findOne({ ...query, published: true }).select('_id').lean()
  if (!trip) return {
    summary: summaryForTrip([], String(slugOrId)),
    items: [], page: 1, limit, total: 0, totalPages: 1,
  }
  const tripId = trip._id
  const filter = { tripId, status: 'approved' }
  const total = await Review.countDocuments(filter)
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)
  const items = await Review.find(filter)
    .populate(USER_POPULATE)
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * limit)
    .limit(limit)
    .lean()
  return {
    summary: summaryForTrip(await ratingSummary([tripId]), tripId),
    items: items.map((d) => toPublicReview(d)),
    page: safePage,
    limit,
    total,
    totalPages,
  }
}

// --- customer ---------------------------------------------------------------

export async function getEligibility(tripSlugOrId, userId) {
  const query = /^[0-9a-fA-F]{24}$/.test(String(tripSlugOrId))
    ? { _id: tripSlugOrId }
    : { slug: tripSlugOrId }
  const trip = await Trip.findOne({ ...query, published: true }).select('_id slug name').lean()
  if (!trip) throw notFound('Trip not found')

  const existing = await Review.findOne({ userId, tripId: trip._id }).lean()
  if (existing) {
    return {
      eligible: false,
      reason: 'already-reviewed',
      review: toPublicReview(existing, { includeStatus: true }),
    }
  }

  const validBooking = await findValidBooking(userId, trip._id)
  if (validBooking) {
    return {
      eligible: true,
      reason: 'valid-booking',
      bookingId: validBooking._id.toString(),
    }
  }

  // Explain WHY not eligible using their most recent booking for this trip.
  const anyBooking = await Booking.findOne({ userId, tripId: trip._id })
    .sort({ createdAt: -1 })
    .lean()
  let reason = 'no-booking'
  if (anyBooking) {
    reason =
      anyBooking.status === 'cancelled'
        ? 'booking-cancelled'
        : anyBooking.status === 'completed'
          ? 'valid-booking'
          : 'booking-not-confirmed'
  }
  return { eligible: false, reason }
}

export async function create(data, userId) {
  // Trip must exist and be published.
  const trip = await Trip.findById(data.tripId).select('_id published').lean()
  if (!trip || !trip.published) throw badRequest('Trip does not exist')

  // Eligibility: a VALID own booking for THIS trip.
  const booking = await findValidBooking(userId, data.tripId)
  if (!booking) {
    throw badRequest('Only travellers with a confirmed or completed booking for this trip can write a review')
  }

  // One review per user per trip.
  const dup = await Review.exists({ userId, tripId: data.tripId })
  if (dup) throw conflict('You have already reviewed this trip')

  // Snapshot metadata from the booking at creation time.
  const lead = booking.travellers?.[0]
  const travellerName =
    booking.customerName || (lead ? `${lead.firstName} ${lead.lastName}` : 'Traveller')

  const doc = await Review.create({
    userId,
    tripId: data.tripId,
    bookingId: booking._id,
    rating: data.rating,
    title: data.title,
    text: data.text,
    travellerName,
    batchDepartureDate: null,
    status: 'pending',
  })

  notif.createReviewNotification(userId, { event:'submitted', review:doc.toObject(), tripName: (await Trip.findById(data.tripId).select('name').lean())?.name }).catch(()=>{})

  return toPublicReview(
    await Review.findById(doc._id).populate(USER_POPULATE).lean(),
    { includeStatus: true }
  )
}

export async function listMine(userId, { page = 1, limit = 10 }) {
  const filter = { userId }
  const total = await Review.countDocuments(filter)
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)
  const items = await Review.find(filter)
    .populate({ path: 'tripId', select: 'name slug destinationId', populate: { path: 'destinationId', select: 'name country' } })
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * limit)
    .limit(limit)
    .lean()
  return {
    items: items.map((d) => {
      const r = toPublicReview(d, { includeStatus: true })
      const trip = d.tripId && typeof d.tripId === 'object' ? d.tripId : null
      r.trip = trip
        ? {
            id: trip._id?.toString(),
            name: trip.name,
            slug: trip.slug,
            destination: trip.destinationId && typeof trip.destinationId === 'object'
              ? { name: trip.destinationId.name, country: trip.destinationId.country }
              : null,
          }
        : null
      return r
    }),
    page: safePage,
    limit,
    total,
    totalPages,
  }
}

// --- admin -------------------------------------------------------------------

export async function listAdmin({ page = 1, limit = 20, status, search }) {
  const filter = {}
  if (status) filter.status = status
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const trips = await Trip.find({ name: rx }).select('_id').lean()
    filter.$or = [
      { title: rx },
      { text: rx },
      { travellerName: rx },
      { tripId: { $in: trips.map((t) => t._id) } },
    ]
  }

  const total = await Review.countDocuments(filter)
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)

  const items = await Review.find(filter)
    .populate(USER_POPULATE)
    .populate({ path: 'tripId', select: 'name slug' })
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * limit)
    .limit(limit)
    .lean()

  return {
    items: items.map((d) => {
      const r = toPublicReview(d, { includeStatus: true, includeBookingId: true })
      r.trip = d.tripId && typeof d.tripId === 'object'
        ? { id: d.tripId._id?.toString(), name: d.tripId.name, slug: d.tripId.slug }
        : null
      return r
    }),
    page: safePage,
    limit,
    total,
    totalPages,
  }
}

export async function adminSetStatus(id, status, note, adminUserId) {
  void adminUserId
  const doc = await Review.findByIdAndUpdate(
    id,
    { status, moderationNote: note || '', moderatedAt: new Date() },
    { new: true }
  )
    .populate(USER_POPULATE)
    .populate({ path: 'tripId', select: 'name slug' })
    .lean()
  if (!doc) throw notFound('Review not found')
  const r = toPublicReview(doc, { includeStatus: true })
  r.moderationNote = doc.moderationNote
  r.trip = doc.tripId && typeof doc.tripId === 'object'
    ? { id: doc.tripId._id?.toString(), name: doc.tripId.name, slug: doc.tripId.slug }
    : null

  if (status === 'approved' || status === 'rejected') {
    const ownerId = doc.userId?._id || doc.userId
    notif.createReviewNotification(ownerId, {
      event: status === 'approved' ? 'approved' : 'rejected',
      review: doc,
      tripName: r.trip?.name,
    }).catch(()=>{})
  }

  return r
}

export async function adminRemove(id) {
  const doc = await Review.findByIdAndDelete(id).lean()
  if (!doc) throw notFound('Review not found')
  return { id: doc._id.toString(), deleted: true }
}

// Recent approved reviews for the homepage — public, no userId scoping.
export async function listRecentApproved(limit = 3) {
  const docs = await Review.find({ status: 'approved' })
    .populate(USER_POPULATE)
    .populate({ path: 'tripId', select: 'name slug heroImage' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
  return docs.map((d) => {
    const r = toPublicReview(d)
    r.tripId = d.tripId && typeof d.tripId === 'object' ? d.tripId._id?.toString() : d.tripId
    r.trip = d.tripId && typeof d.tripId === 'object'
      ? { id: d.tripId._id?.toString(), name: d.tripId.name, slug: d.tripId.slug, heroImage: d.tripId.heroImage }
      : null
    return r
  })
}
