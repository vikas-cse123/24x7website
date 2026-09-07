import User from '../models/User.js'
import Wishlist from '../models/Wishlist.js'
import Trip from '../models/Trip.js'
import Destination from '../models/Destination.js'

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toSafeUser(doc) {
  // Exclude secrets; include timestamps and status
  const o = doc.toObject ? doc.toObject() : doc
  return {
    id: o._id?.toString() || o.id,
    name: o.name || '',
    email: o.email || '',
    mobile: o.mobile || '',
    countryCode: o.countryCode || '+91',
    role: o.role || 'user',
    emailVerified: !!o.emailVerified,
    mobileVerified: !!o.mobileVerified,
    isActive: o.isActive !== false,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    lastLoginAt: o.lastLoginAt || null,
  }
}

export async function listUsers({ page = 1, limit = 25, search, role, verification, status }) {
  const filter = {}
  if (role && role !== 'all') {
    // role can be user/staff/admin; also handle 'customer' alias for user
    const r = String(role).toLowerCase()
    const mapped = r === 'customer' ? 'user' : r
    filter.role = mapped
  }
  if (verification && verification !== 'all') {
    filter.emailVerified = verification === 'verified'
  }
  if (status && status !== 'all') {
    filter.isActive = status === 'active'
  }
  if (search && String(search).trim()) {
    const q = String(search).trim()
    const rx = new RegExp(escapeRegExp(q), 'i')
    // Search across name, email, mobile. For phone we also try digits-only.
    const digits = q.replace(/\D/g, '')
    const or = [{ name: rx }, { email: rx }, { mobile: rx }]
    // If search contains digits, also allow searching concatenated countryCode+mobile via mobile field fallback
    // Mobile field is digits only, so direct rx on mobile already covers.
    // Also search by full phone display: we can match mobile digits
    if (digits && digits !== q) {
      const rxDigits = new RegExp(escapeRegExp(digits), 'i')
      or.push({ mobile: rxDigits })
      // Also search email as digits not needed
    }
    // Ensure we don't overwrite existing $or if other filters also use it (they don't)
    filter.$or = or
  }

  const total = await User.countDocuments(filter)
  const lim = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100)
  const pg = Math.max(parseInt(page, 10) || 1, 1)
  const totalPages = Math.max(1, Math.ceil(total / lim))
  const safePage = Math.min(pg, totalPages)
  const skip = (safePage - 1) * lim

  const docs = await User.find(filter)
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(lim)
    .lean()

  const items = docs.map((d) => ({
    id: d._id.toString(),
    name: d.name || '',
    email: d.email || '',
    mobile: d.mobile || '',
    countryCode: d.countryCode || '+91',
    role: d.role,
    emailVerified: !!d.emailVerified,
    mobileVerified: !!d.mobileVerified,
    isActive: d.isActive !== false,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    lastLoginAt: d.lastLoginAt || null,
  }))

  return { items, total, page: safePage, limit: lim, totalPages }
}

export async function getUserById(id) {
  const doc = await User.findById(id).select('-passwordHash').lean()
  if (!doc) return null
  return {
    id: doc._id.toString(),
    name: doc.name || '',
    email: doc.email || '',
    mobile: doc.mobile || '',
    countryCode: doc.countryCode || '+91',
    role: doc.role,
    emailVerified: !!doc.emailVerified,
    mobileVerified: !!doc.mobileVerified,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    lastLoginAt: doc.lastLoginAt || null,
  }
}

export async function listWishlistForUser(userId) {
  const user = await User.findById(userId).select('_id').lean()
  if (!user) {
    const err = new Error('User not found')
    err.status = 404
    throw err
  }
  const items = await Wishlist.find({ userId }).sort({ createdAt: -1 }).lean()
  const tripIds = items.filter((i) => i.itemType === 'trip').map((i) => i.itemId)
  const destIds = items.filter((i) => i.itemType === 'destination').map((i) => i.itemId)
  const [trips, dests] = await Promise.all([
    tripIds.length ? Trip.find({ _id: { $in: tripIds } }).populate('destinationId', 'name slug country').lean() : [],
    destIds.length ? Destination.find({ _id: { $in: destIds } }).lean() : [],
  ])
  const tripMap = new Map(trips.map((t) => [t._id.toString(), t]))
  const destMap = new Map(dests.map((d) => [d._id.toString(), d]))
  return items.map((it) => {
    const idStr = it.itemId.toString()
    const base = {
      id: it._id.toString(),
      itemType: it.itemType,
      itemId: idStr,
      createdAt: it.createdAt,
      updatedAt: it.updatedAt,
    }
    if (it.itemType === 'trip') {
      const t = tripMap.get(idStr)
      if (!t) return { ...base, unavailable: true, item: null }
      return {
        ...base,
        unavailable: false,
        item: {
          id: t._id.toString(),
          name: t.name,
          slug: t.slug,
          heroImage: t.heroImage,
          destination: t.destinationId ? { name: t.destinationId.name, slug: t.destinationId.slug, country: t.destinationId.country } : null,
          startingPrice: t.startingPrice,
          currency: t.currency,
          published: t.published,
        },
      }
    } else {
      const d = destMap.get(idStr)
      if (!d) return { ...base, unavailable: true, item: null }
      return {
        ...base,
        unavailable: false,
        item: {
          id: d._id.toString(),
          name: d.name,
          slug: d.slug,
          country: d.country,
          heroImage: d.heroImage,
        },
      }
    }
  })
}
