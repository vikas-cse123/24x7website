import Traveller from '../models/Traveller.js'
import User, { toPublicUser } from '../models/User.js'

function badRequest(message, errors) {
  const err = new Error(message)
  err.status = 400
  if (errors) err.errors = errors
  return err
}
function notFound(message = 'Not found') {
  const err = new Error(message)
  err.status = 404
  return err
}

// --- profile ---------------------------------------------------------------
// Phone (mobile + countryCode) is the OTP login identity and is intentionally
// read-only here — see ADR-018. Only name/email are updatable.

export async function getProfile(userId) {
  const user = await User.findById(userId).lean()
  if (!user) throw notFound('Account not found')
  return toPublicUser(user)
}

export async function updateProfile(data, userId) {
  // Whitelist fields explicitly; protected fields can never arrive.
  const patch = {}
  if (data.name !== undefined) patch.name = data.name
  if (data.email !== undefined && data.email !== '') patch.email = data.email.toLowerCase()

  try {
    const user = await User.findByIdAndUpdate(userId, patch, { new: true, runValidators: true }).lean()
    if (!user) throw notFound('Account not found')
    return toPublicUser(user)
  } catch (err) {
    if (err?.code === 11000) {
      throw badRequest('This email is already in use on another account', [
        { path: 'email', message: 'This email is already in use' },
      ])
    }
    throw err
  }
}

// --- saved travellers --------------------------------------------------------
// Strict ownership: every query/filter includes userId, so one user can never
// read or mutate another user's travellers (404 rather than 403 — no leak).

function normaliseTravellerPayload(data) {
  const out = {}
  if (data.firstName !== undefined) out.firstName = data.firstName
  if (data.lastName !== undefined) out.lastName = data.lastName
  if (data.email !== undefined) out.email = data.email || ''
  if (data.phone !== undefined) out.phone = data.phone || ''
  if (data.countryCode !== undefined) out.countryCode = data.countryCode || '+91'
  if (data.gender !== undefined) out.gender = data.gender ?? null
  if (data.dateOfBirth !== undefined) out.dateOfBirth = data.dateOfBirth ?? null
  return out
}

export async function listTravellers(userId) {
  const docs = await Traveller.find({ userId }).sort({ updatedAt: -1 }).lean()
  return { items: docs.map((d) => toPublicTraveller(d)), total: docs.length }
}

export function toPublicTraveller(doc) {
  if (!doc) return null
  return {
    id: doc.id || doc._id?.toString(),
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    phone: doc.phone,
    countryCode: doc.countryCode,
    gender: doc.gender,
    dateOfBirth: doc.dateOfBirth,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export async function createTraveller(data, userId) {
  const doc = await Traveller.create({ ...normaliseTravellerPayload(data), userId })
  return toPublicTraveller(doc.toObject())
}

export async function updateTraveller(id, data, userId) {
  const patch = normaliseTravellerPayload(data)
  const doc = await Traveller.findOneAndUpdate(
    { _id: id, userId },
    { $set: patch },
    { new: true, runValidators: true }
  ).lean()
  if (!doc) throw notFound('Traveller not found')
  return toPublicTraveller(doc)
}

export async function deleteTraveller(id, userId) {
  const doc = await Traveller.findOneAndDelete({ _id: id, userId }).lean()
  if (!doc) throw notFound('Traveller not found')
  return toPublicTraveller(doc)
}
