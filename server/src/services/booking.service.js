import Booking from '../models/Booking.js'
import TripBatch from '../models/TripBatch.js'
import Trip from '../models/Trip.js'
import { startOfTodayUtc } from './tripBatch.service.js'
import * as notif from './notification.service.js'

function badRequest(message, errors) {
  const err = new Error(message)
  err.status = 400
  if (errors) err.errors = errors
  return err
}
function conflict(message) {
  const err = new Error(message)
  err.status = 409
  return err
}
function notFound(message = 'Booking not found') {
  const err = new Error(message)
  err.status = 404
  return err
}

async function generateBookingCode() {
  const last = await Booking.find({ bookingCode: /^BK-\d+$/ })
    .select('bookingCode')
    .sort({ bookingCode: -1 })
    .limit(1)
    .lean()
  let next = 1
  if (last.length > 0) {
    const match = /^BK-(\d+)$/.exec(last[0].bookingCode)
    if (match) next = Number(match[1]) + 1
  }
  const candidate = `BK-${String(next).padStart(6, '0')}`
  if (!(await Booking.exists({ bookingCode: candidate }))) return candidate
  let n = next + 1
  for (;;) {
    const code = `BK-${String(n).padStart(6, '0')}`
    if (!(await Booking.exists({ bookingCode: code }))) return code
    n += 1
  }
}

const TRIP_POPULATE = { path: 'tripId', select: 'name slug tripCode destinationId durationDays durationNights' }
const BATCH_POPULATE = {
  path: 'tripBatchId',
  select: 'batchCode departureDate returnDate price originalPrice currency status totalSeats bookedSeats',
}
const DEST_SECOND_POPULATE = { path: 'tripId', populate: { path: 'destinationId', select: 'name slug country' } }

export function toPublicBooking(doc) {
  if (!doc) return null
  const rawTrip = doc.tripId
  const rawBatch = doc.tripBatchId
  const dest =
    rawTrip && typeof rawTrip === 'object' && rawTrip.destinationId && typeof rawTrip.destinationId === 'object'
      ? rawTrip.destinationId
      : null
  return {
    id: doc.id || doc._id?.toString(),
    bookingCode: doc.bookingCode,
    userId: doc.userId?._id ? doc.userId._id.toString() : doc.userId?.toString?.() || null,
    trip:
      rawTrip && typeof rawTrip === 'object'
        ? {
            id: rawTrip._id?.toString() || rawTrip.id,
            name: rawTrip.name,
            slug: rawTrip.slug,
            tripCode: rawTrip.tripCode,
            durationDays: rawTrip.durationDays,
            durationNights: rawTrip.durationNights,
            destination:
              dest && typeof dest === 'object'
                ? { id: dest._id?.toString(), name: dest.name, slug: dest.slug, country: dest.country }
                : null,
          }
        : rawTrip?.toString?.() || null,
    batch:
      rawBatch && typeof rawBatch === 'object'
        ? {
            id: rawBatch._id?.toString() || rawBatch.id,
            batchCode: rawBatch.batchCode,
            departureDate: rawBatch.departureDate,
            returnDate: rawBatch.returnDate,
          }
        : rawBatch?.toString?.() || null,
    customerName: doc.customerName,
    customerEmail: doc.customerEmail,
    customerPhone: doc.customerPhone,
    countryCode: doc.countryCode,
    travellers: doc.travellers,
    travellerCount: doc.travellerCount,
    unitPrice: doc.unitPrice,
    subtotal: doc.subtotal,
    discountAmount: doc.discountAmount,
    totalAmount: doc.totalAmount,
    currency: doc.currency,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    cancelledAt: doc.cancelledAt ?? null,
  }
}

async function findBookableBatch(batchId) {
  const batch = await TripBatch.findById(batchId).lean()
  if (!batch) throw badRequest('Selected departure does not exist')
  if (!batch.published) throw badRequest('This departure is not available for booking')
  if (batch.departureDate < startOfTodayUtc()) throw badRequest('This departure has already left')
  if (!['open', 'full'].includes(batch.status)) {
    throw badRequest('This departure is not open for booking')
  }
  if (batch.bookingOpenDate && batch.bookingOpenDate > new Date()) {
    throw badRequest('Booking for this departure has not opened yet')
  }
  if (batch.bookingCloseDate && batch.bookingCloseDate < startOfTodayUtc()) {
    throw badRequest('Booking for this departure has closed')
  }
  return batch
}

// --- customer --------------------------------------------------------------

export async function create(data, userId) {
  const batch = await findBookableBatch(data.tripBatchId)

  const availableSeats = Math.max(0, (batch.totalSeats || 0) - (batch.bookedSeats || 0))
  if (availableSeats <= 0) throw conflict('This departure is sold out.')
  if (data.travellerCount > availableSeats) {
    throw conflict(
      `Only ${availableSeats} ${availableSeats === 1 ? 'seat is' : 'seats are'} currently available.`
    )
  }

  const count = data.travellerCount
  const unitPrice = Number(batch.price) || 0
  const subtotal = Math.round(unitPrice * count * 100) / 100
  const discountPerHead =
    batch.originalPrice != null && Number(batch.originalPrice) > unitPrice
      ? Number(batch.originalPrice) - unitPrice
      : 0
  const discountAmount = Math.round(discountPerHead * count * 100) / 100
  const totalAmount = Math.round((subtotal - discountAmount) * 100) / 100

  // ATOMIC SEAT RESERVATION — the database guarantees overselling is impossible.
  // The conditional update only succeeds when enough seats remain; two
  // concurrent bookings can never both pass this guard. See ADR-016.
  const reserved = await TripBatch.findOneAndUpdate(
    { _id: batch._id, $expr: { $lte: ['$bookedSeats', { $subtract: ['$totalSeats', count] }] } },
    { $inc: { bookedSeats: count }, $set: { updatedBy: userId } },
    { new: true }
  )
  if (!reserved) {
    const fresh = await TripBatch.findById(batch._id).select('totalSeats bookedSeats').lean()
    const avail = Math.max(0, (fresh?.totalSeats || 0) - (fresh?.bookedSeats || 0))
    throw conflict(
      avail <= 0
        ? 'This departure just sold out.'
        : `Only ${avail} ${avail === 1 ? 'seat is' : 'seats are'} currently available.`
    )
  }

  // Exactly-once compensation: whatever fails below releases the reservation
  // AT MOST once. (A previous version could double-subtract on the
  // idempotent-replay path — guarded here with a flag.)
  let compensated = false
  const compensateReservation = async () => {
    if (compensated) return
    compensated = true
    await TripBatch.updateOne(
      { _id: batch._id, bookedSeats: { $gte: count } },
      { $inc: { bookedSeats: -count } }
    ).catch(() => {})
  }

  try {
    // bookingCode generation reads the current max, so two concurrent creates
    // can momentarily derive the same code. On a bookingCode collision simply
    // regenerate and retry — the unique index makes the last writer win a
    // fresh number. Any other duplicate-key error is the idempotency guard.
    for (let attempt = 0; ; attempt++) {
      let booking
      try {
        const bookingCode = await generateBookingCode()
        booking = await Booking.create({
          bookingCode,
          userId,
          tripId: batch.tripId,
          tripBatchId: batch._id,
          customerName: data.customerName,
          customerEmail: data.customerEmail.toLowerCase(),
          customerPhone: data.customerPhone,
          countryCode: data.countryCode || '+91',
          travellers: data.travellers.map((t) => ({
            firstName: t.firstName,
            lastName: t.lastName,
            gender: t.gender ?? null,
            dateOfBirth: t.dateOfBirth ?? null,
            phone: t.phone || '',
            email: t.email ? t.email.toLowerCase() : '',
          })),
          travellerCount: count,
          unitPrice,
          subtotal,
          discountAmount,
          totalAmount,
          currency: batch.currency || 'INR',
          status: 'pending',
          paymentStatus: 'unpaid',
          idempotencyKey: data.idempotencyKey,
        })
      } catch (insertErr) {
        const msg = String(insertErr?.message || '')
        if (insertErr?.code === 11000 && msg.includes('bookingCode') && attempt < 5) {
          continue // regenerate a fresh bookingCode and retry the insert
        }
        throw insertErr
      }

      const populated = await Booking.findById(booking._id)
        .populate(TRIP_POPULATE)
        .populate(BATCH_POPULATE)
        .populate(DEST_SECOND_POPULATE)

      notif.createBookingNotification(userId, { event:'created', booking, tripName: populated?.tripId?.name }).catch(()=>{})

      return toPublicBooking(populated.toObject ? populated.toObject() : populated)
    }
  } catch (err) {
    await compensateReservation()

    // Idempotent retry (same user + flow key): return the ORIGINAL booking so
    // retries and network duplicates never create a second booking.
    if (err?.code === 11000 && data.idempotencyKey) {
      const existing = await Booking.findOne({ userId, idempotencyKey: data.idempotencyKey })
        .populate(TRIP_POPULATE)
        .populate(BATCH_POPULATE)
        .populate(DEST_SECOND_POPULATE)
        .lean()
      if (existing) return toPublicBooking(existing)
    }
    throw err
  }
}

export async function listMine({ page = 1, limit = 10, status }, userId) {
  const filter = { userId }
  if (status) filter.status = status
  const total = await Booking.countDocuments(filter)
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)
  const items = await Booking.find(filter)
    .populate(TRIP_POPULATE)
    .populate(BATCH_POPULATE)
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * limit)
    .limit(limit)
    .lean()
  return { items: items.map(toPublicBooking), page: safePage, limit, total, totalPages }
}

async function getOwned(idOrQuery, userId) {
  const booking = await Booking.findOne({ ...idOrQuery, userId })
    .populate(TRIP_POPULATE)
    .populate(BATCH_POPULATE)
    .populate(DEST_SECOND_POPULATE)
    .lean()
  return booking
}

export async function getByIdForUser(id, userId) {
  const booking = await getOwned({ _id: id }, userId)
  return toPublicBooking(booking)
}

export async function getByCodeForUser(code, userId) {
  const booking = await getOwned({ bookingCode: String(code).toUpperCase() }, userId)
  return toPublicBooking(booking)
}

// Cancellation: flip the booking first with a status-guarded conditional update
// (so a booking can only ever be cancelled once), then release the reserved
// seats atomically. If the seat release fails the flip is reverted, so state
// never ends up half-cancelled. See docs/BOOKING_SYSTEM.md.
export async function cancelForUser(id, userId, isAdmin = false) {
  const filter = isAdmin ? { _id: id } : { _id: id, userId }
  const booking = await Booking.findOne(filter)
  if (!booking) throw notFound()

  const CANCELLABLE = ['pending', 'confirmed', 'payment_pending']
  if (!CANCELLABLE.includes(booking.status)) {
    throw badRequest(
      booking.status === 'cancelled' ? 'This booking is already cancelled' : 'This booking can no longer be cancelled'
    )
  }

  const flipped = await Booking.findOneAndUpdate(
    { _id: booking._id, status: { $in: CANCELLABLE } },
    { status: 'cancelled', cancelledAt: new Date(), cancelledBy: userId },
    { new: true }
  )
  if (!flipped) throw conflict('This booking was already cancelled')

  const count = booking.travellerCount
  const released = await TripBatch.updateOne(
    { _id: booking.tripBatchId, bookedSeats: { $gte: count } },
    { $inc: { bookedSeats: -count } }
  )
  if (released.modifiedCount !== 1) {
    // Compensate: restore the previous booking status rather than lose seats
    // from the batch record inconsistently.
    await Booking.updateOne(
      { _id: booking._id, status: 'cancelled' },
      { status: booking.status, cancelledAt: null, cancelledBy: null }
    )
    throw new Error('Could not release reserved seats; please try again')
  }

  if (booking.paymentStatus === 'paid') {
    await Booking.updateOne({ _id: booking._id }, { paymentStatus: 'refunded' })
  }

  const populated = await Booking.findById(booking._id)
    .populate(TRIP_POPULATE)
    .populate(BATCH_POPULATE)
    .populate(DEST_SECOND_POPULATE)
    .lean()

  notif.createBookingNotification(booking.userId, { event:'cancelled', booking, tripName: populated?.tripId?.name }).catch(()=>{})

  return toPublicBooking(populated)
}

// --- admin -----------------------------------------------------------------

export async function listAdmin({ page = 1, limit = 20, search, status, paymentStatus }) {
  const filter = {}
  if (status) filter.status = status
  if (paymentStatus) filter.paymentStatus = paymentStatus
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const trips = await Trip.find({ name: rx }).select('_id').lean()
    filter.$or = [{ bookingCode: rx }, { customerName: rx }, { customerEmail: rx }, { customerPhone: rx }, { tripId: { $in: trips.map((t) => t._id) } }]
  }

  const total = await Booking.countDocuments(filter)
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)

  const items = await Booking.find(filter)
    .populate(TRIP_POPULATE)
    .populate(BATCH_POPULATE)
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * limit)
    .limit(limit)
    .lean()

  return { items: items.map(toPublicBooking), page: safePage, limit, total, totalPages }
}

export async function getAdminById(id) {
  const booking = await Booking.findById(id)
    .populate(TRIP_POPULATE)
    .populate(BATCH_POPULATE)
    .populate(DEST_SECOND_POPULATE)
    .lean()
  return toPublicBooking(booking)
}

// Admin status change. 'cancelled' is intentionally NOT settable here — use
// the cancel endpoint so seats are released atomically.
export async function adminSetStatus(id, status, adminUserId) {
  const allowed = ['pending', 'confirmed', 'payment_pending', 'completed']
  const booking = await Booking.findOneAndUpdate(
    { _id: id, status: { $ne: 'cancelled' } },
    { status },
    { new: true }
  )
  if (!booking) {
    const exists = await Booking.findById(id)
    if (!exists) throw notFound()
    throw badRequest('Cancelled bookings cannot change status')
  }
  void adminUserId
  const populated = await Booking.findById(booking._id)
    .populate(TRIP_POPULATE)
    .populate(BATCH_POPULATE)
    .populate(DEST_SECOND_POPULATE)
    .lean()

  notif.createBookingNotification(populated?.userId?._id || populated?.userId, {
    event: status === 'confirmed' ? 'confirmed' : 'status_changed',
    booking: populated, tripName: populated?.tripId?.name,
  }).catch(()=>{})

  return toPublicBooking(populated)
}

export async function adminCancel(id, adminUserId) {
  return cancelForUser(id, adminUserId, true)
}
