import { Router } from 'express'
import { listGlobal } from '../controllers/publicFaq.controller.js'
import { validate } from '../utils/validate.js'
import { faqLimitSchema } from '../validators/faq.validator.js'

const router = Router()

router.get('/', validate(faqLimitSchema, 'query'), listGlobal)

export default router
