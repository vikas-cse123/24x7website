import * as bookingService from '../services/booking.service.js'

function notFound(res) {
  return res.status(404).json({ success: false, message: 'Booking not found' })
}

export async function list(req, res, next) {
  try {
    const data = await bookingService.listAdmin(req.query)
    res.status(200).json({ success: true, data, message: 'Bookings' })
  } catch (err) {
    next(err)
  }
}

export async function getOne(req, res, next) {
  try {
    const booking = await bookingService.getAdminById(req.params.id)
    if (!booking) return notFound(res)
    res.status(200).json({ success: true, data: booking })
  } catch (err) {
    next(err)
  }
}

export async function setStatus(req, res, next) {
  try {
    const booking = await bookingService.adminSetStatus(req.params.id, req.body.status, req.userId)
    if (!booking) return notFound(res)
    res.status(200).json({ success: true, data: booking, message: 'Booking status updated' })
  } catch (err) {
    next(err)
  }
}

export async function cancel(req, res, next) {
  try {
    const booking = await bookingService.adminCancel(req.params.id, req.userId)
    res.status(200).json({ success: true, data: booking, message: 'Booking cancelled' })
  } catch (err) {
    next(err)
  }
}
