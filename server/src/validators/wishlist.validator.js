import { z } from 'zod'
const OBJECT_ID = /^[0-9a-fA-F]{24}$/
export const createWishlistSchema = z.object({
  type: z.enum(['trip', 'destination']),
  id: z.string().regex(OBJECT_ID, 'Invalid id'),
})
export const deleteWishlistParamSchema = z.object({
  type: z.enum(['trip', 'destination']),
  id: z.string().regex(OBJECT_ID, 'Invalid id'),
})
