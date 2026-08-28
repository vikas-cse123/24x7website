import { Router } from 'express'
import {
  list,
  getOne,
  updateStatus,
  remove,
} from '../controllers/enquiry.controller.js'
import { validate } from '../utils/validate.js'
import {
  listEnquiriesQuerySchema,
  updateEnquiryStatusSchema,
} from '../validators/enquiry.validator.js'

const router = Router()

// Auth middleware (requireAuth + requireRole(admin)) is applied once at the
// parent admin router level — never weakened here.
router.get('/', validate(listEnquiriesQuerySchema, 'query'), list)
router.get('/:id', getOne)
router.patch('/:id/status', validate(updateEnquiryStatusSchema), updateStatus)
router.delete('/:id', remove)

export default router