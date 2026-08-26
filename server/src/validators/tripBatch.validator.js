import { z } from 'zod'
import { BATCH_STATUSES } from '../models/TripBatch.js'

const OBJECT_ID = /^[0-9a-fA-F]{24}$/
// Date-only input. Stored as UTC midnight; never a local-time timestamp.
export const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

const dateOnlySchema = z
  .string()
  .trim()
  .regex(DATE_ONLY, 'Use the YYYY-MM-DD date format')

// batchCode / createdBy / updatedBy are intentionally NOT accepted from clients.
const batchFields = {
  tripId: z.string().regex(OBJECT_ID, 'Invalid trip'),
  departureDate: dateOnlySchema,
  returnDate: dateOnlySchema,
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  originalPrice: z.coerce.number().min(0, 'Original price cannot be negative').nullable().optional(),
  currency: z.string().trim().toUpperCase().max(10).optional(),
  totalSeats: z.coerce.number().int('Total seats must be a whole number').min(1, 'At least 1 seat is required'),
  bookedSeats: z.coerce.number().int('Booked seats must be a whole number').min(0, 'Booked seats cannot be negative').optional(),
  bookingOpenDate: dateOnlySchema.nullable().optional(),
  bookingCloseDate: dateOnlySchema.nullable().optional(),
  status: z.enum(BATCH_STATUSES).optional(),
  published: z.boolean().optional(),
  notes: z.string().trim().max(2000).optional(),
}

// Create: apply defaults for omitted optional fields.
export const createTripBatchSchema = z.object({
  tripId: batchFields.tripId,
  departureDate: batchFields.departureDate,
  returnDate: batchFields.returnDate,
  price: batchFields.price,
  originalPrice: batchFields.originalPrice.default(null),
  currency: batchFields.currency.default('INR'),
  totalSeats: batchFields.totalSeats,
  bookedSeats: batchFields.bookedSeats.default(0),
  bookingOpenDate: batchFields.bookingOpenDate.default(null),
  bookingCloseDate: batchFields.bookingCloseDate.default(null),
  status: batchFields.status.default('draft'),
  published: batchFields.published.default(false),
  notes: batchFields.notes.default(''),
})

// Update: partial with NO defaults so omitted fields stay untouched (see ADR-011).
export const updateTripBatchSchema = z.object(batchFields).partial()

export const adminListBatchesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  tripId: z.string().regex(OBJECT_ID).optional(),
  status: z.enum(BATCH_STATUSES).optional(),
  published: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
})

class BatchValidationError extends Error {
  constructor(message, errors) {
    super(message)
    this.status = 400
    this.errors = errors
  }
}

function toDay(value) {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

// Cross-field business rules. Runs on the EFFECTIVE values (merged patch +
// existing document for updates) so partial updates cannot break invariants.
export function assertBatchRules(data) {
  const errors = []

  const departure = toDay(data.departureDate)
  const returnDate = toDay(data.returnDate)
  if (!departure) errors.push({ path: 'departureDate', message: 'Departure date is required' })
  if (!returnDate) errors.push({ path: 'returnDate', message: 'Return date is required' })
  if (departure && returnDate && returnDate <= departure) {
    errors.push({ path: 'returnDate', message: 'Return date must be after the departure date' })
  }

  const price = Number(data.price)
  if (Number.isNaN(price) || price < 0) {
    errors.push({ path: 'price', message: 'Price must be 0 or greater' })
  }
  if (data.originalPrice !== null && data.originalPrice !== undefined && data.originalPrice !== '') {
    const original = Number(data.originalPrice)
    if (!Number.isNaN(original)) {
      if (original < 0) {
        errors.push({ path: 'originalPrice', message: 'Original price cannot be negative' })
      } else if (!Number.isNaN(price) && price > original) {
        errors.push({ path: 'price', message: 'Price cannot be greater than the original price' })
      }
    }
  }

  const totalSeats = Number(data.totalSeats)
  if (!Number.isInteger(totalSeats) || totalSeats <= 0) {
    errors.push({ path: 'totalSeats', message: 'Total seats must be at least 1' })
  }
  const bookedSeats = Number(data.bookedSeats ?? 0)
  if (!Number.isNaN(bookedSeats)) {
    if (bookedSeats < 0) {
      errors.push({ path: 'bookedSeats', message: 'Booked seats cannot be negative' })
    } else if (Number.isInteger(totalSeats) && totalSeats > 0 && bookedSeats > totalSeats) {
      errors.push({ path: 'bookedSeats', message: 'Booked seats cannot exceed total seats' })
    }
  }

  const open = toDay(data.bookingOpenDate)
  const close = toDay(data.bookingCloseDate)
  if (open && close && close < open) {
    errors.push({ path: 'bookingCloseDate', message: 'Booking close date cannot be before the booking open date' })
  }

  if (errors.length > 0) {
    throw new BatchValidationError(errors[0].message, errors)
  }
}
