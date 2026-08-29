import mongoose from 'mongoose'

// Centralized application settings — one document per `key`, with arbitrary
// `data` payloads. The first consumer is `branding` (admin-managed website
// logo); future global settings reuse the same collection instead of adding
// new ones.
const appSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Branding example: { logo: { url, publicId, alt, updatedAt } }.
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
)

const AppSetting = mongoose.model('AppSetting', appSettingSchema)

export default AppSetting