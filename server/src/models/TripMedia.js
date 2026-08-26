import mongoose from 'mongoose'

const tripMediaSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    mediaType: { type: String, enum: ['photo', 'video'], default: 'photo', index: true },
    publicId: { type: String, trim: true, default: '' },
    secureUrl: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, default: '' },
    thumbnailUrl: { type: String, trim: true, default: '' },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    format: { type: String, trim: true, default: '' },
    bytes: { type: Number, default: null },
    altText: { type: String, trim: true, default: '', maxlength: 200 },
    caption: { type: String, trim: true, default: '', maxlength: 300 },
    published: { type: Boolean, default: false, index: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { transform(_doc, ret){ ret.id=ret._id.toString(); delete ret._id; delete ret.__v; return ret } } }
)

tripMediaSchema.index({ tripId: 1, published: 1, displayOrder: 1 })
tripMediaSchema.index({ tripId: 1, mediaType: 1 })

const TripMedia = mongoose.model('TripMedia', tripMediaSchema)
export default TripMedia
