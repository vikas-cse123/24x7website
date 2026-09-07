import { z } from 'zod'

export const adminListUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  search: z.string().trim().optional(),
  role: z.enum(['all', 'user', 'customer', 'staff', 'admin']).optional().default('all'),
  verification: z.enum(['all', 'verified', 'unverified']).optional().default('all'),
  status: z.enum(['all', 'active', 'inactive']).optional().default('all'),
})

export const adminUserIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user id'),
})
