import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      trim: true,
      // Stored in E.164-ish local form (countryCode + mobile).
      match: [/^[0-9]{10}$/, 'Mobile must be a valid 10-digit number'],
    },
    countryCode: {
      type: String,
      required: true,
      default: '+91',
      trim: true,
      match: [/^\+\d{1,4}$/, 'Invalid country code'],
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    role: {
      type: String,
      enum: ['user', 'staff', 'admin'],
      default: 'user',
    },
    // Verification / authentication state.
    mobileVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
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

// A user is uniquely identified by their (countryCode, mobile) pair.
userSchema.index({ countryCode: 1, mobile: 1 }, { unique: true })
userSchema.index({ email: 1 }, { unique: true, sparse: true })

export function toPublicUser(user) {
  return {
    id: user.id,
    mobile: user.mobile,
    countryCode: user.countryCode,
    name: user.name,
    email: user.email,
    role: user.role,
    mobileVerified: user.mobileVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  }
}

const User = mongoose.model('User', userSchema)

export default User
