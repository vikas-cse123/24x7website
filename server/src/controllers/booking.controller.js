import * as bookingService from '../services/booking.service.js'

function notFound(res) {
  return res.status(404).json({ success: false, message: 'Booking not found' })
}

export async function create(req, res, next) {
  try {
    const booking = await bookingService.create(req.body, req.userId)
    res.status(201).json({
      success: true,
      data: booking,
      message: `Booking ${booking.bookingCode} created`,
    })
  } catch (err) {
    next(err)
  }
}

export async function list(req, res, next) {
  try {
    const data = await bookingService.listMine(req.query, req.userId)
    res.status(200).json({ success: true, data, message: 'Your bookings' })
  } catch (err) {
    next(err)
  }
}

export async function getOne(req, res, next) {
  try {
    const booking = await bookingService.getByIdForUser(req.params.id, req.userId)
    if (!booking) return notFound(res)
    res.status(200).json({ success: true, data: booking })
  } catch (err) {
    next(err)
  }
}

export async function getByCode(req, res, next) {
  try {
    const booking = await bookingService.getByCodeForUser(req.params.code, req.userId)
    if (!booking) return notFound(res)
    res.status(200).json({ success: true, data: booking })
  } catch (err) {
    next(err)
  }
}

export async function cancel(req, res, next) {
  try {
    const booking = await bookingService.cancelForUser(req.params.id, req.userId)
    res.status(200).json({ success: true, data: booking, message: 'Booking cancelled' })
  } catch (err) {
    next(err)
  }
}
