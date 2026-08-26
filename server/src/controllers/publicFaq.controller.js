import {
  listPublishedGlobal,
  listPublishedForDestination,
  listPublishedForTrip,
} from '../services/faq.service.js'

// GET /api/faqs — global published FAQs (homepage).
export async function listGlobal(req, res, next) {
  try {
    const items = await listPublishedGlobal(req.query.limit)
    res.status(200).json({ success: true, data: { items }, message: 'FAQs' })
  } catch (err) {
    next(err)
  }
}

// Mounted on destination routes: GET /api/destinations/:slug/faqs
export async function listForDestination(req, res, next) {
  try {
    const data = await listPublishedForDestination(req.params.slug)
    if (!data) return res.status(404).json({ success: false, message: 'Destination not found' })
    res.status(200).json({ success: true, data, message: 'Destination FAQs' })
  } catch (err) {
    next(err)
  }
}

// Mounted on trip routes: GET /api/trips/:slug/faqs
export async function listForTrip(req, res, next) {
  try {
    const data = await listPublishedForTrip(req.params.slug)
    if (!data) return res.status(404).json({ success: false, message: 'Trip not found' })
    res.status(200).json({ success: true, data, message: 'Trip FAQs' })
  } catch (err) {
    next(err)
  }
}
