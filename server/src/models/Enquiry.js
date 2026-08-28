import mongoose from 'mongoose'

// A contact / quote / custom-trip request from a website visitor (public lead).
// Mirrors the planned design in docs/DATABASE.md. `source` identifies the
// channel the enquiry came from (e.g. the custom-trip "Plan Your Dream Trip"
// form uses `custom_trip`). `status` drives the admin triage workflow.
const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    countryCode: { type: String, trim: true, maxlength: 6, default: '+91' },
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      default: null,
      index: true,
    },
    destinationName: { type: String, trim: true, maxlength: 120, default: '' },
    // Channel that produced the lead. Existing convention: lowercase snake_case.
    source: { type: String, trim: true, maxlength: 60, default: 'website', index: true },
    message: { type: String, trim: true, maxlength: 2000, default: '' },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'resolved'],
      default: 'new',
      index: true,
    },
    // Optional authenticated lead attribution; public visitors leave it null.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
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

enquirySchema.index({ status: 1, createdAt: -1 })

const Enquiry = mongoose.model('Enquiry', enquirySchema)
export default Enquiry