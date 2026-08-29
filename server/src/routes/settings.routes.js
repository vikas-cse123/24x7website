import { Router } from 'express'
import {
  getPublicSettings,
  getPublicBranding,
} from '../controllers/settings.controller.js'

const router = Router()

// Public settings — no auth required so the whole website can read the active
// logo, phone number and promotional banner without a session.
router.get('/', getPublicSettings)
router.get('/branding', getPublicBranding)

export default router