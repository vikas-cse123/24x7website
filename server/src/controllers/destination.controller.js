import * as destinationService from '../services/destination.service.js'

export async function list(req, res, next) {
  try {
    const data = await destinationService.listPublic(req.query)
    res.status(200).json({ success: true, data, message: 'Destinations' })
  } catch (err) {
    next(err)
  }
}

export async function getBySlug(req, res, next) {
  try {
    const destination = await destinationService.getPublicBySlug(req.params.slug)
    if (!destination) {
      return res.status(404).json({ success: false, message: 'Destination not found' })
    }
    res.status(200).json({ success: true, data: destination })
  } catch (err) {
    next(err)
  }
}