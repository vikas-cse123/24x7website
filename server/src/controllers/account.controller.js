import * as accountService from '../services/account.service.js'
import * as bookingService from '../services/booking.service.js'

function notFound(res, message = 'Not found') {
  return res.status(404).json({ success: false, message })
}

// --- profile ---------------------------------------------------------------
export async function getProfile(req, res, next) {
  try {
    const profile = await accountService.getProfile(req.userId)
    res.status(200).json({ success: true, data: profile, message: 'Profile' })
  } catch (err) {
    next(err)
  }
}

export async function updateProfile(req, res, next) {
  try {
    const profile = await accountService.updateProfile(req.body, req.userId)
    res.status(200).json({ success: true, data: profile, message: 'Profile updated' })
  } catch (err) {
    next(err)
  }
}

// --- bookings (delegates to the Phase 9 service — one system, no duplicates)
export async function listBookings(req, res, next) {
  try {
    const data = await bookingService.listMine(req.query, req.userId)
    res.status(200).json({ success: true, data, message: 'Your bookings' })
  } catch (err) {
    next(err)
  }
}

export async function getBookingByCode(req, res, next) {
  try {
    const booking = await bookingService.getByCodeForUser(req.params.bookingCode, req.userId)
    if (!booking) return notFound(res, 'Booking not found')
    res.status(200).json({ success: true, data: booking })
  } catch (err) {
    next(err)
  }
}

// --- saved travellers --------------------------------------------------------
export async function listTravellers(req, res, next) {
  try {
    const data = await accountService.listTravellers(req.userId)
    res.status(200).json({ success: true, data, message: 'Saved travellers' })
  } catch (err) {
    next(err)
  }
}

export async function createTraveller(req, res, next) {
  try {
    const traveller = await accountService.createTraveller(req.body, req.userId)
    res.status(201).json({ success: true, data: traveller, message: 'Traveller added' })
  } catch (err) {
    next(err)
  }
}

export async function updateTraveller(req, res, next) {
  try {
    const traveller = await accountService.updateTraveller(req.params.id, req.body, req.userId)
    if (!traveller) return notFound(res, 'Traveller not found')
    res.status(200).json({ success: true, data: traveller, message: 'Traveller updated' })
  } catch (err) {
    next(err)
  }
}

export async function deleteTraveller(req, res, next) {
  try {
    const traveller = await accountService.deleteTraveller(req.params.id, req.userId)
    if (!traveller) return notFound(res, 'Traveller not found')
    res.status(200).json({ success: true, data: traveller, message: 'Traveller removed' })
  } catch (err) {
    next(err)
  }
}
