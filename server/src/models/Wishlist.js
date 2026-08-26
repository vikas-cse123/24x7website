import mongoose from 'mongoose'

const wishlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    itemType: { type: String, enum: ['trip', 'destination'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true, toJSON: { transform(_doc, ret) { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; return ret; } } }
)

wishlistSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true })
wishlistSchema.index({ userId: 1, createdAt: -1 })

const Wishlist = mongoose.model('Wishlist', wishlistSchema)
export default Wishlist
