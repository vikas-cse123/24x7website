import mongoose from 'mongoose'

export const BOOKING_STATUSES = ['pending', 'confirmed', 'payment_pending', 'cancelled', 'completed']
export const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'failed', 'refunded']

// A Booking is always created against a TripBatch (which belongs to a Trip,
// which belongs to a Destination). Pricing fields are an immutable SNAPSHOT of
// the batch price at booking time — later batch price changes never alter
// existing bookings.
const travellerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    gender: { type: String, enum: ['male', 'female', 'other'], default: null },
    dateOfBirth: { type: String, default: null }, // 'YYYY-MM-DD'
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    email: { type: String, trim: true, lowercase: true, maxlength: 200, default: '' },
  },
  { _id: false }
)

const bookingSchema = new mongoose.Schema(
  {
    // Server-generated (BK-000001), unique, immutable. Never client-provided.
    bookingCode: { type: String, required: true, trim: true, uppercase: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    tripBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TripBatch',
      required: true,
      index: true,
    },

    // --- customer / contact ------------------------------------------------
    customerName: { type: String, required: true, trim: true, maxlength: 120 },
    customerEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    customerPhone: { type: String, required: true, trim: true, maxlength: 15 },
    countryCode: { type: String, required: true, trim: true, maxlength: 5, default: '+91' },

    // --- travellers ---------------------------------------------------------
    travellers: { type: [travellerSchema], required: true },
    travellerCount: { type: Number, required: true, min: 1 },

    // --- PRICE SNAPSHOT (server-computed at creation; immutable) -------------
    unitPrice: { type: Number, required: true, min: 0 }, // batch.price per traveller
    subtotal: { type: Number, required: true, min: 0 }, // unitPrice * travellerCount
    discountAmount: { type: Number, required: true, min: 0, default: 0 }, // (originalPrice-price)*count when applicable
    totalAmount: { type: Number, required: true, min: 0 }, // subtotal - discountAmount
    currency: { type: String, uppercase: true, trim: true, default: 'INR' },

    status: { type: String, enum: BOOKING_STATUSES, default: 'pending', index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid' },

    // Idempotency: the same key from the same user can never create two
    // bookings (compound unique index). Client generates one key per flow.
    idempotencyKey: { type: String, trim: true, maxlength: 64 },

    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  }
)

bookingSchema.index({ bookingCode: 1 }, { unique: true })
// Idempotency guard — one booking per user per flow key.
bookingSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
)
// Admin list ordering/filtering.
bookingSchema.index({ createdAt: -1 })
bookingSchema.index({ status: 1 })

const Booking = mongoose.model('Booking', bookingSchema)

export default Booking
