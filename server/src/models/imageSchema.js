import mongoose from 'mongoose'

// Reusable image sub-schema — used by Destination, Trip, Blog, etc.
// Stores Cloudinary identifiers separately from delivery URLs so a future
// provider migration only needs publicId + metadata, not a URL scrape.
const imageSchema = new mongoose.Schema(
  {
    // Delivery URL (Cloudinary secure_url when uploaded, or legacy external URL)
    url: { type: String, trim: true, default: '' },
    secureUrl: { type: String, trim: true, default: '' },
    publicId: { type: String, trim: true, default: '' },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    format: { type: String, trim: true, default: '' },
    bytes: { type: Number, default: null },
    resourceType: { type: String, trim: true, default: 'image' },
    alt: { type: String, trim: true, default: '' },
    altText: { type: String, trim: true, default: '' },
  },
  { _id: false }
)

export default imageSchema
