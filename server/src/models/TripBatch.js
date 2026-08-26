import mongoose from 'mongoose'

export const BATCH_STATUSES = ['draft', 'open', 'full', 'closed', 'cancelled', 'completed']

// Date-only strategy: clients send 'YYYY-MM-DD' strings; the service stores
// them as Date objects at UTC midnight. All date comparisons happen against
// UTC day boundaries so a date such as 2026-10-03 can never shift to
// 2026-10-02 through timezone conversion. See docs/DECISIONS.md (ADR-014).
function parseDateOnly(value) {
  if (!value) return undefined
  if (value instanceof Date) return value
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim())
  if (!match) return new Date(value)
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
}

const tripBatchSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    // Server-generated (BAT-000001), unique, never client-editable.
    batchCode: { type: String, required: true, trim: true, uppercase: true },
    departureDate: {
      type: Date,
      required: true,
      set: (v) => parseDateOnly(v),
    },
    returnDate: {
      type: Date,
      required: true,
      set: (v) => parseDateOnly(v),
    },
    price: { type: Number, required: true, min: 0 },
    // When present and greater than price, discount = originalPrice - price.
    originalPrice: { type: Number, min: 0, default: null },
    currency: { type: String, uppercase: true, trim: true, default: 'INR' },
    totalSeats: { type: Number, required: true, min: 1 },
    bookedSeats: { type: Number, min: 0, default: 0 },
    bookingOpenDate: { type: Date, set: (v) => parseDateOnly(v), default: null },
    bookingCloseDate: { type: Date, set: (v) => parseDateOnly(v), default: null },
    status: { type: String, enum: BATCH_STATUSES, default: 'draft', index: true },
    published: { type: Boolean, default: false },
    notes: { type: String, trim: true, default: '' },
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

tripBatchSchema.index({ batchCode: 1 }, { unique: true })
// Public upcoming-departure queries filter on these fields together.
tripBatchSchema.index({ tripId: 1, published: 1, status: 1, departureDate: 1 })
// Discovery aggregation (Phase 8) matches visibility without a tripId:
// { published, status, departureDate (+ optional price range) }.
tripBatchSchema.index({ published: 1, status: 1, departureDate: 1 })

// availableSeats is ALWAYS derived (totalSeats - bookedSeats); it is never
// stored as editable state. Future Booking writes must update bookedSeats
// atomically (see docs/BOOKING_SYSTEM.md).
export function computeAvailableSeats(doc) {
  const total = Number(doc.totalSeats) || 0
  const booked = Number(doc.bookedSeats) || 0
  return Math.max(0, total - booked)
}

// Discount is derived, not stored. Only meaningful when originalPrice > price.
export function computeDiscount(doc) {
  const price = Number(doc.price)
  const original = doc.originalPrice === null || doc.originalPrice === undefined ? null : Number(doc.originalPrice)
  if (original === null || !(original > price)) return null
  return Math.round((original - price) * 100) / 100
}

// Normalise a populated trip (+ its destination) for admin output.
function toPublicTripSummary(trip) {
  if (!trip || typeof trip !== 'object' || !trip.name) return null
  const dest = trip.destinationId
  return {
    id: trip.id || trip._id?.toString(),
    name: trip.name,
    slug: trip.slug,
    tripCode: trip.tripCode,
    durationDays: trip.durationDays,
    durationNights: trip.durationNights,
    startingPrice: trip.startingPrice ?? null,
    currency: trip.currency,
    destination:
      dest && typeof dest === 'object'
        ? { id: dest.id || dest._id?.toString(), name: dest.name, slug: dest.slug, country: dest.country }
        : null,
  }
}

export function toPublicTripBatch(doc, options = {}) {
  if (!doc) return null
  const rawTrip = options.trip || doc.tripId
  return {
    id: doc.id || doc._id?.toString(),
    tripId:
      rawTrip && typeof rawTrip === 'object' && rawTrip._id
        ? rawTrip._id.toString()
        : rawTrip?.toString?.() || null,
    trip: toPublicTripSummary(rawTrip),
    batchCode: doc.batchCode,
    departureDate: doc.departureDate,
    returnDate: doc.returnDate,
    price: doc.price,
    originalPrice: doc.originalPrice ?? null,
    discountAmount: computeDiscount(doc),
    currency: doc.currency,
    totalSeats: doc.totalSeats,
    bookedSeats: doc.bookedSeats,
    availableSeats: computeAvailableSeats(doc),
    bookingOpenDate: doc.bookingOpenDate ?? null,
    bookingCloseDate: doc.bookingCloseDate ?? null,
    status: doc.status,
    published: doc.published,
    notes: options.includeNotes ? doc.notes : undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

const TripBatch = mongoose.model('TripBatch', tripBatchSchema)

export default TripBatch
