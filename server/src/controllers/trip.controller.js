import * as tripService from '../services/trip.service.js'

export async function list(req, res, next) {
  try {
    const data = await tripService.listPublic(req.query)
    res.status(200).json({ success: true, data, message: 'Trips' })
  } catch (err) {
    next(err)
  }
}

export async function getBySlug(req, res, next) {
  try {
    const trip = await tripService.getPublicBySlug(req.params.slug)
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' })
    }
    res.status(200).json({ success: true, data: trip })
  } catch (err) {
    next(err)
  }
}