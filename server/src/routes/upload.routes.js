import { Router } from 'express'
import { uploadSingle, uploadMany, uploadVideo, handleMulterError } from '../middleware/upload.js'
import { uploadOne, uploadBatch, uploadOneVideo, remove } from '../controllers/upload.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { ADMIN_ROLES } from '../utils/roles.js'

const router = Router()
router.use(requireAuth, requireRole(...ADMIN_ROLES))

router.post('/single', (req, res, next) => uploadSingle(req, res, (err) => err ? handleMulterError(err, req, res, next) : uploadOne(req, res, next)))
router.post('/many', (req, res, next) => uploadMany(req, res, (err) => err ? handleMulterError(err, req, res, next) : uploadBatch(req, res, next)))
router.post('/video', (req, res, next) => uploadVideo(req, res, (err) => err ? handleMulterError(err, req, res, next) : uploadOneVideo(req, res, next)))
router.delete('/', remove)

export default router
