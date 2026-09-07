import mongoose from 'mongoose'

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['emailVerification', 'passwordReset', 'passwordResetVerified'],
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

otpSchema.index({ email: 1, type: 1 })
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const Otp = mongoose.model('Otp', otpSchema)

export default Otp
