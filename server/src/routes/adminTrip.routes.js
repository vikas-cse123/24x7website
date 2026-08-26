import { Router } from 'express'
import {
  list,
  getOne,
  create,
  update,
  remove,
  publish,
  unpublish,
} from '../controllers/adminTrip.controller.js'
import { validate } from '../utils/validate.js'
import {
  createTripSchema,
  updateTripSchema,
  adminListTripsQuerySchema,
} from '../validators/trip.validator.js'

const router = Router()

// Auth middleware is applied once at the parent admin router level.
router.get('/', validate(adminListTripsQuerySchema, 'query'), list)
router.get('/:id', getOne)
router.post('/', validate(createTripSchema), create)
router.patch('/:id', validate(updateTripSchema), update)
router.delete('/:id', remove)
router.patch('/:id/publish', publish)
router.patch('/:id/unpublish', unpublish)

export default router