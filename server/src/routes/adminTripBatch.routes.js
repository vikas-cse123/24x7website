import { Router } from 'express'
import {
  list,
  getOne,
  create,
  update,
  remove,
  publish,
  unpublish,
  changeStatus,
} from '../controllers/adminTripBatch.controller.js'
import { validate } from '../utils/validate.js'
import {
  createTripBatchSchema,
  updateTripBatchSchema,
  adminListBatchesQuerySchema,
} from '../validators/tripBatch.validator.js'
import { BATCH_STATUSES } from '../models/TripBatch.js'
import { z } from 'zod'

const router = Router()

// Auth middleware is applied once at the parent admin router level.
router.get('/', validate(adminListBatchesQuerySchema, 'query'), list)
router.get('/:id', getOne)
router.post('/', validate(createTripBatchSchema), create)
router.patch('/:id', validate(updateTripBatchSchema), update)
router.delete('/:id', remove)
router.patch('/:id/publish', publish)
router.patch('/:id/unpublish', unpublish)
router.patch(
  '/:id/status',
  validate(z.object({ status: z.enum(BATCH_STATUSES) })),
  changeStatus
)

export default router
