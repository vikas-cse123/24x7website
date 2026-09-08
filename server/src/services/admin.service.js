import Destination from '../models/Destination.js'
import Trip from '../models/Trip.js'
import Blog from '../models/Blog.js'
import User from '../models/User.js'
import TripBatch from '../models/TripBatch.js'
import Booking from '../models/Booking.js'
import Enquiry from '../models/Enquiry.js'
import { startOfTodayUtc } from './tripBatch.service.js'

// Admin dashboard summary — Destinations, Trips, Blogs, Users
export async function getDashboardSummary() {
  const [destinations, trips, blogs, users] = await Promise.all([
    Destination.countDocuments(),
    Trip.countDocuments(),
    Blog.countDocuments(),
    User.countDocuments(),
  ])

  return {
    destinations,
    trips,
    blogs,
    users,
  }
}
