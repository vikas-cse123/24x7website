import { Router } from 'express'
import {
  list,
  getOne,
  create,
  update,
  remove,
  publish,
  unpublish,
  reorder,
} from '../controllers/adminFaq.controller.js'
import { validate } from '../utils/validate.js'
import {
  createFaqSchema,
  updateFaqSchema,
  adminListFaqsQuerySchema,
  reorderFaqsSchema,
} from '../validators/faq.validator.js'

const router = Router()

// Auth middleware is applied once at the parent admin router level.
router.get('/', validate(adminListFaqsQuerySchema, 'query'), list)
router.post('/reorder', validate(reorderFaqsSchema), reorder)
router.get('/:id', getOne)
router.post('/', validate(createFaqSchema), create)
router.patch('/:id', validate(updateFaqSchema), update)
router.delete('/:id', remove)
router.patch('/:id/publish', publish)
router.patch('/:id/unpublish', unpublish)

export default router
