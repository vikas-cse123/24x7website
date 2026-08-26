import { z } from 'zod'

const OBJECT_ID = /^[0-9a-fA-F]{24}$/

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected']
const VALID_BOOKING_STATUSES = ['confirmed', 'completed']

export const createReviewSchema = z.object({
  tripId: z.string().regex(OBJECT_ID, 'Invalid trip'),
  rating: z.coerce
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Please choose a rating between 1 and 5 stars')
    .max(5, 'Please choose a rating between 1 and 5 stars'),
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  text: z.string().trim().min(10, 'Review must be at least 10 characters').max(2000),
})

export const listReviewsByTripQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(20).optional().default(6),
})

export const adminListReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(REVIEW_STATUSES).optional(),
  search: z.string().trim().optional(),
})

export const adminModerateReviewSchema = z.object({
  status: z.enum(['approved', 'rejected', 'pending']),
  note: z.string().trim().max(500).optional(),
})
