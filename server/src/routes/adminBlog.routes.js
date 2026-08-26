import { Router } from 'express'
import {
  list,
  getOne,
  create,
  update,
  publish,
  unpublish,
  remove,
} from '../controllers/adminBlog.controller.js'
import { validate } from '../utils/validate.js'
import {
  createBlogSchema,
  updateBlogSchema,
  adminListBlogsQuerySchema,
} from '../validators/blog.validator.js'

const router = Router()

// Auth middleware is applied once at the parent admin router level.
router.get('/', validate(adminListBlogsQuerySchema, 'query'), list)
router.get('/:id', getOne)
router.post('/', validate(createBlogSchema), create)
router.patch('/:id', validate(updateBlogSchema), update)
router.delete('/:id', remove)
router.patch('/:id/publish', publish)
router.patch('/:id/unpublish', unpublish)

export default router
