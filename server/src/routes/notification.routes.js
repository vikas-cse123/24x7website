import { Router } from 'express'
import { validate } from '../utils/validate.js'
import { z } from 'zod'
import * as ctrl from '../controllers/notification.controller.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id')
const pageSchema = z.object({ page: z.coerce.number().int().min(1).optional().default(1), limit: z.coerce.number().int().min(1).max(50).optional().default(10) })

router.get('/', validate(pageSchema,'query'), ctrl.list)
router.get('/unread-count', ctrl.unreadCount)
router.patch('/read-all', ctrl.markAll)
router.patch('/:id/read', validate(z.object({ id: objectId }),'params'), ctrl.markRead)
router.delete('/:id', validate(z.object({ id: objectId }),'params'), ctrl.remove)

export default router
