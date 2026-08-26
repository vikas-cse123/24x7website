import { z } from 'zod'

export const BATCH_STATUSES = ['draft', 'open', 'full', 'closed', 'cancelled', 'completed']

export const BATCH_STATUS_LABELS = {
  draft: 'Draft',
  open: 'Open',
  full: 'Full',
  closed: 'Closed',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

// Form schema. Cross-field rules run here (all fields present in the form)
// and are enforced again server-side against merged values on update.
export const tripBatchSchema = z
  .object({
    tripId: z.string().min(1, 'Select a trip'),
    departureDate: z.string().regex(DATE_ONLY, 'Departure date is required'),
    returnDate: z.string().regex(DATE_ONLY, 'Return date is required'),
    price: z.coerce.number({ invalid_type_error: 'Price is required' }).min(0, 'Price cannot be negative'),
    originalPrice: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? null : v),
      z.coerce.number().min(0, 'Original price cannot be negative').nullable()
    ),
    currency: z.string().trim().toUpperCase().max(10),
    totalSeats: z.coerce.number().int('Total seats must be a whole number').min(1, 'At least 1 seat is required'),
    bookedSeats: z.coerce
      .number()
      .int('Booked seats must be a whole number')
      .min(0, 'Booked seats cannot be negative'),
    bookingOpenDate: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? null : v),
      z.string().regex(DATE_ONLY, 'Use the YYYY-MM-DD format').nullable()
    ),
    bookingCloseDate: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? null : v),
      z.string().regex(DATE_ONLY, 'Use the YYYY-MM-DD format').nullable()
    ),
    status: z.enum(BATCH_STATUSES),
    published: z.boolean(),
    notes: z.string().trim().max(2000),
  })
  .superRefine((data, ctx) => {
    if (data.departureDate && data.returnDate && data.returnDate <= data.departureDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['returnDate'],
        message: 'Return date must be after the departure date',
      })
    }
    if (
      data.originalPrice !== null &&
      Number(data.price) > Number(data.originalPrice)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price'],
        message: 'Price cannot be greater than the original price',
      })
    }
    if (Number(data.bookedSeats) > Number(data.totalSeats)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['bookedSeats'],
        message: 'Booked seats cannot exceed total seats',
      })
    }
    if (
      data.bookingOpenDate &&
      data.bookingCloseDate &&
      data.bookingCloseDate < data.bookingOpenDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['bookingCloseDate'],
        message: 'Booking close date cannot be before the booking open date',
      })
    }
  })

export function toPayload(values) {
  return {
    ...values,
    originalPrice:
      values.originalPrice === '' || values.originalPrice === undefined ? null : values.originalPrice,
    bookingOpenDate: values.bookingOpenDate || null,
    bookingCloseDate: values.bookingCloseDate || null,
  }
}

export const tripBatchFormDefault = {
  tripId: '',
  departureDate: '',
  returnDate: '',
  price: '',
  originalPrice: null,
  currency: 'INR',
  totalSeats: 16,
  bookedSeats: 0,
  bookingOpenDate: null,
  bookingCloseDate: null,
  status: 'draft',
  published: false,
  notes: '',
}
