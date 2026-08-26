import mongoose from 'mongoose'

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected']

// A Review is created by an authenticated user who holds a VALID booking
// (confirmed/completed) for the trip. One review per user per trip (compound
// unique index). Moderation defaults to 'pending' — only approved reviews are
// public. travellerName is snapshotted from the booking at creation; later
// profile/booking changes never alter it.
const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    text: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },

    status: { type: String, enum: REVIEW_STATUSES, default: 'pending', index: true },

    // Snapshot metadata for display ("Verified booking · Rohan M").
    travellerName: { type: String, trim: true, maxlength: 120, default: '' },
    batchDepartureDate: { type: Date, default: null },

    moderatedAt: { type: Date, default: null },
    moderationNote: { type: String, trim: true, maxlength: 500, default: '' },
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

reviewSchema.index({ tripId: 1, status: 1, createdAt: -1 })
// One review per user per trip.
reviewSchema.index({ userId: 1, tripId: 1 }, { unique: true })

const Review = mongoose.model('Review', reviewSchema)

export default Review
