import Destination from '../models/Destination.js'
import Trip from '../models/Trip.js'
import TripBatch from '../models/TripBatch.js'
import Booking from '../models/Booking.js'
import { startOfTodayUtc } from './tripBatch.service.js'

// Admin dashboard summary. Enquiry count remains zeroed until that model
// exists — no fabricated numbers. Batch and booking metrics are real:
// - upcomingBatches: published, open/full, departing in the future (public view)
// - openBatches / fullBatches: all batches currently in that status
// - bookings: total bookings; *_Bookings: per-status counts
export async function getDashboardSummary() {
  const today = startOfTodayUtc()

  const [
    destinations,
    trips,
    upcomingBatches,
    openBatches,
    fullBatches,
    totalBookings,
    pendingBookings,
    confirmedBookings,
    paymentPendingBookings,
  ] = await Promise.all([
    Destination.countDocuments(),
    Trip.countDocuments(),
    TripBatch.countDocuments({
      published: true,
      status: { $in: ['open', 'full'] },
      departureDate: { $gt: today },
    }),
    TripBatch.countDocuments({ status: 'open' }),
    TripBatch.countDocuments({ status: 'full' }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({ status: 'payment_pending' }),
  ])

  return {
    destinations,
    trips,
    upcomingBatches,
    openBatches,
    fullBatches,
    bookings: totalBookings,
    pendingBookings,
    confirmedBookings,
    paymentPendingBookings,
    enquiries: 0,
  }
}
