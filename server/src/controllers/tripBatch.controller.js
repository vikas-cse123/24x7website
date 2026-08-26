import * as tripBatchService from '../services/tripBatch.service.js'

export async function listByTrip(req, res, next) {
  try {
    const batches = await tripBatchService.listPublicByTrip(req.params.tripId)
    if (!batches) {
      return res.status(404).json({ success: false, message: 'Trip not found' })
    }
    res.status(200).json({ success: true, data: { items: batches }, message: 'Upcoming departures' })
  } catch (err) {
    // Invalid ObjectId or other lookup errors should not leak internals.
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Trip not found' })
    }
    next(err)
  }
}
