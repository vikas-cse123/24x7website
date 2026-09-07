import { Router } from 'express'
import { list, getOne, wishlist } from '../controllers/adminUser.controller.js'
import { validate } from '../utils/validate.js'
import { adminListUsersQuerySchema, adminUserIdParamSchema } from '../validators/adminUser.validator.js'

const router = Router()

router.get('/', validate(adminListUsersQuerySchema, 'query'), list)
router.get('/:id', validate(adminUserIdParamSchema, 'params'), getOne)
router.get('/:id/wishlist', validate(adminUserIdParamSchema, 'params'), wishlist)

export default router
