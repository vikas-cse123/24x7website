import { Router } from 'express'
import { list, getBySlug } from '../controllers/trip.controller.js'
import { listByTrip } from '../controllers/tripBatch.controller.js'
import { listForTrip } from '../controllers/publicFaq.controller.js'
import { validate } from '../utils/validate.js'
import { listTripsQuerySchema } from '../validators/trip.validator.js'
import { z } from 'zod'

const router = Router()

router.get('/', validate(listTripsQuerySchema, 'query'), list)
// Public upcoming departures for one trip. Registered before '/:slug' is fine —
// this path has two segments so it cannot be captured by the slug route.
router.get(
  '/:tripId/batches',
  validate(z.object({ tripId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid trip') }), 'params'),
  listByTrip
)
// Trip FAQs (trip → destination → global, deduped, ordered).
router.get('/:slug/faqs', listForTrip)
router.get('/:slug', getBySlug)

export default router
