import { Router } from 'express'
import { list, getBySlug } from '../controllers/destination.controller.js'
import { listForDestination } from '../controllers/publicFaq.controller.js'
import { validate } from '../utils/validate.js'
import { listDestinationsQuerySchema } from '../validators/destination.validator.js'

const router = Router()

router.get('/', validate(listDestinationsQuerySchema, 'query'), list)
router.get('/:slug', getBySlug)
// Destination FAQs (published, ordered) — matched before nothing conflicts.
router.get('/:slug/faqs', listForDestination)

export default router