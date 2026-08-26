import mongoose from 'mongoose'

// A reusable FAQ. Scope (mutually exclusive):
//   global        → destinationId & tripId null
//   destination   → destinationId set, tripId null
//   trip          → tripId set, destinationId null
const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, minlength: 5, maxlength: 300 },
    answer: { type: String, required: true, trim: true, maxlength: 2000 },
    // Free-form topical tag for admin organisation (e.g. 'booking', 'general').
    category: { type: String, trim: true, maxlength: 60, default: 'general', index: true },
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      default: null,
      index: true,
    },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null, index: true },
    displayOrder: { type: Number, required: true, min: 0, default: 0 },
    published: { type: Boolean, default: false, index: true },
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

faqSchema.index({ published: 1, displayOrder: 1 })

const Faq = mongoose.model('Faq', faqSchema)

export default Faq
