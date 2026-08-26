import { Router } from 'express'
import { create, list, remove } from '../controllers/wishlist.controller.js'
import { validate } from '../utils/validate.js'
import { createWishlistSchema, deleteWishlistParamSchema } from '../validators/wishlist.validator.js'
import { requireAuth } from '../middleware/auth.js'
const router = Router()
router.use(requireAuth)
router.post('/', validate(createWishlistSchema), create)
router.get('/', list)
router.delete('/:type/:id', validate(deleteWishlistParamSchema,'params'), remove)
export default router
