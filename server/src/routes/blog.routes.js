import { Router } from 'express'
import { list, listByDestination, getBySlug } from '../controllers/blog.controller.js'
import { validate } from '../utils/validate.js'
import { listBlogsQuerySchema } from '../validators/blog.validator.js'

const router = Router()

// '/destination/:slug' must be matched before the slug route; it has two
// segments so it cannot be captured by '/:slug' anyway.
router.get('/', validate(listBlogsQuerySchema, 'query'), list)
router.get('/destination/:destinationSlug', validate(listBlogsQuerySchema, 'query'), listByDestination)
router.get('/:slug', getBySlug)

export default router
