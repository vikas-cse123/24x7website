import { Router } from 'express'
import {
  list,
  getOne,
  create,
  update,
  remove,
  publish,
  unpublish,
} from '../controllers/adminDestination.controller.js'
import { validate } from '../utils/validate.js'
import {
  createDestinationSchema,
  updateDestinationSchema,
  adminListDestinationsQuerySchema,
} from '../validators/destination.validator.js'

const router = Router()

// Auth middleware is applied once at the parent admin router level.
router.get('/', validate(adminListDestinationsQuerySchema, 'query'), list)
router.get('/:id', getOne)
router.post('/', validate(createDestinationSchema), create)
router.patch('/:id', validate(updateDestinationSchema), update)
router.delete('/:id', remove)
router.patch('/:id/publish', publish)
router.patch('/:id/unpublish', unpublish)

export default router