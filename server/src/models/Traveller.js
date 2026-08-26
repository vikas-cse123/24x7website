import mongoose from 'mongoose'

// A saved traveller is owned by one user and used to prefill bookings.
// Booking traveller data is always COPIED at booking time — later edits here
// never change existing bookings.
const travellerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200, default: '' },
    phone: { type: String, trim: true, maxlength: 15, default: '' },
    countryCode: { type: String, trim: true, maxlength: 5, default: '+91' },
    gender: { type: String, enum: ['male', 'female', 'other'], default: null },
    dateOfBirth: { type: String, default: null }, // 'YYYY-MM-DD'
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        delete ret.userId
        return ret
      },
    },
  }
)

travellerSchema.index({ userId: 1, updatedAt: -1 })

const Traveller = mongoose.model('Traveller', travellerSchema)

export default Traveller
