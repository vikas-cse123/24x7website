import mongoose from 'mongoose'

export const NOTIFICATION_TYPES = [
  'booking_created',
  'booking_confirmed',
  'booking_cancelled',
  'booking_status_changed',
  'trip_departure_changed',
  'trip_batch_cancelled',
  'trip_batch_changed',
  'review_submitted',
  'review_approved',
  'review_rejected',
]

export const NOTIFICATION_ENTITY_TYPES = ['booking', 'trip', 'trip_batch', 'review', 'destination']

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    relatedEntityType: { type: String, enum: NOTIFICATION_ENTITY_TYPES, default: null },
    relatedEntityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    // Deterministic event key to prevent duplicates (userId + eventKey unique).
    eventKey: { type: String, trim: true, default: '' },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { transform(_doc, ret){ ret.id=ret._id.toString(); delete ret._id; delete ret.__v; return ret } } }
)

notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, readAt: 1 })
notificationSchema.index({ userId: 1, eventKey: 1 }, { unique: true, sparse: true })

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification
