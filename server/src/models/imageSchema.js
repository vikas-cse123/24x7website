import mongoose from 'mongoose'

// Reusable image sub-schema — used by Destination, Trip, Blog, etc.
// Stores the storage identifier (`publicId`) separately from delivery URLs.
// For S3 uploads `publicId` is the object key and `url`/`secureUrl` are the
// public S3 URLs. Legacy records may still hold Cloudinary public IDs/URLs
// and continue to display (fields are intentionally kept backward compatible).
const imageSchema = new mongoose.Schema(
  {
    // Delivery URL (S3 object URL when uploaded, or legacy external/Cloudinary URL)
    url: { type: String, trim: true, default: '' },
    secureUrl: { type: String, trim: true, default: '' },
    // Storage identifier: S3 object key for new uploads (legacy: Cloudinary publicId)
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
