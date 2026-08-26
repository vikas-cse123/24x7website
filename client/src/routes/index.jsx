import { Routes, Route, useParams } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { HomePage } from '@/pages/HomePage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { DestinationsPage } from '@/pages/DestinationsPage'
import { DestinationPage } from '@/pages/DestinationPage'
import { TripsPage } from '@/pages/TripsPage'
import { TripPage } from '@/pages/TripPage'
import { BookingPage } from '@/pages/BookingPage'
import { BookingConfirmationPage } from '@/pages/BookingConfirmationPage'
import { AccountLayoutPage } from '@/pages/account/AccountLayoutPage'
import { AccountProfilePage } from '@/pages/account/AccountProfilePage'
import { AccountBookingsPage } from '@/pages/account/AccountBookingsPage'
import { AccountBookingDetailPage } from '@/pages/account/AccountBookingDetailPage'
import { BlogsPage, DestinationBlogsPage } from '@/pages/BlogsPage'
import { BlogDetailPage } from '@/pages/BlogDetailPage'
import { FaqsPage } from '@/pages/FaqsPage'
import { AccountTravellersPage } from '@/pages/account/AccountTravellersPage'
import { AccountReviewsPage } from '@/pages/account/AccountReviewsPage'
import { AccountWishlistPage } from '@/pages/account/AccountWishlistPage'
import { AccountNotificationsPage } from '@/pages/account/AccountNotificationsPage'

// /booking/BK-000001 → confirmation; /booking/<trip-slug> → booking wizard.
function BookingRouteSwitch() {
  const { param } = useParams()
  return /^BK-/i.test(param || '') ? <BookingConfirmationPage /> : <BookingPage />
}
import { RequireAdmin } from '@/components/admin/RequireAdmin'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminDestinationsPage } from '@/pages/admin/AdminDestinationsPage'
import { AdminDestinationFormPage } from '@/pages/admin/AdminDestinationFormPage'
import { AdminTripsPage } from '@/pages/admin/AdminTripsPage'
import { AdminTripFormPage } from '@/pages/admin/AdminTripFormPage'
import { AdminTripBatchesPage } from '@/pages/admin/AdminTripBatchesPage'
import { AdminTripBatchFormPage } from '@/pages/admin/AdminTripBatchFormPage'
import { AdminBookingsPage } from '@/pages/admin/AdminBookingsPage'
import { AdminBookingDetailPage } from '@/pages/admin/AdminBookingDetailPage'
import { AdminReviewsPage } from '@/pages/admin/AdminReviewsPage'
import { AdminBlogsPage } from '@/pages/admin/AdminBlogsPage'
import { AdminBlogFormPage } from '@/pages/admin/AdminBlogFormPage'
import { AdminMediaPage } from '@/pages/admin/AdminMediaPage'
import { AdminFaqsPage } from '@/pages/admin/AdminFaqsPage'
import { AdminFaqFormPage } from '@/pages/admin/AdminFaqFormPage'
import { AdminPlaceholderPage } from '@/pages/admin/AdminPlaceholderPage'

function placeholder(title) {
  return <PlaceholderPage title={title} />
}

function adminPlaceholder(title) {
  return <AdminPlaceholderPage title={title} />
}

// Public route architecture. Real pages for these routes will be implemented in
// later milestones; for now they render placeholders so the navigation has no
// broken links.
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />

        {/* Destinations */}
        <Route path="/destinations" element={<DestinationsPage />} />
        <Route path="/destination/:slug" element={<DestinationPage />} />

        {/* Trips */}
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trip/:slug" element={<TripPage />} />

        {/* Booking — '/booking/BK-…' renders the private confirmation; anything
            else is treated as the trip slug for the booking wizard. */}
        <Route
          path="/booking/:param"
          element={<BookingRouteSwitch />}
        />

        {/* Content — travel blogs */}
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/blogs/:destinationSlug" element={<DestinationBlogsPage />} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
        <Route path="/faqs" element={<FaqsPage />} />

        {/* Company */}
        <Route path="/about" element={placeholder('About Us')} />
        <Route path="/contact" element={placeholder('Contact Us')} />
        <Route path="/privacy-policy" element={placeholder('Privacy Policy')} />
        <Route path="/terms" element={placeholder('Terms & Conditions')} />

        {/* Marketing / navigation placeholders */}
        <Route path="/group-trips" element={placeholder('Group Trips')} />
        <Route path="/deals" element={placeholder('Deals')} />
        <Route path="/travel-styles" element={placeholder('Travel Styles')} />
        <Route path="/upcoming-trips" element={placeholder('Upcoming Trips')} />
        <Route path="/middle-age-trips" element={placeholder('Middle Age Trips')} />
        <Route path="/customised-trips" element={placeholder('Customised Trips')} />
        <Route path="/more" element={placeholder('More')} />

        {/* Account (private — noindex; layout guards auth) */}
        <Route path="/account" element={<AccountLayoutPage />}>
          <Route index element={<AccountProfilePage />} />
          <Route path="profile" element={<AccountProfilePage />} />
          <Route path="bookings" element={<AccountBookingsPage />} />
          <Route path="bookings/:bookingCode" element={<AccountBookingDetailPage />} />
          <Route path="travellers" element={<AccountTravellersPage />} />
          <Route path="reviews" element={<AccountReviewsPage />} />
          <Route path="wishlist" element={<AccountWishlistPage />} />
          <Route path="notifications" element={<AccountNotificationsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={placeholder('Page not found')} />
      </Route>

      {/* Admin area: frontend guard + AdminLayout. Backend enforces roles. */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="destinations" element={<AdminDestinationsPage />} />
        <Route path="destinations/new" element={<AdminDestinationFormPage mode="create" />} />
        <Route path="destinations/:id/edit" element={<AdminDestinationFormPage mode="edit" />} />
        <Route path="trips" element={<AdminTripsPage />} />
        <Route path="trips/new" element={<AdminTripFormPage mode="create" />} />
        <Route path="trips/:id/edit" element={<AdminTripFormPage mode="edit" />} />
        <Route path="trip-batches" element={<AdminTripBatchesPage />} />
        <Route path="trip-batches/new" element={<AdminTripBatchFormPage mode="create" />} />
        <Route path="trip-batches/:id/edit" element={<AdminTripBatchFormPage mode="edit" />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="bookings/:id" element={<AdminBookingDetailPage />} />
        <Route path="customers" element={adminPlaceholder('Customers')} />
        <Route path="enquiries" element={adminPlaceholder('Enquiries')} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="blogs" element={<AdminBlogsPage />} />
        <Route path="blogs/new" element={<AdminBlogFormPage mode="create" />} />
        <Route path="blogs/:id/edit" element={<AdminBlogFormPage mode="edit" />} />
        <Route path="faqs" element={<AdminFaqsPage />} />
        <Route path="faqs/new" element={<AdminFaqFormPage mode="create" />} />
        <Route path="faqs/:id/edit" element={<AdminFaqFormPage mode="edit" />} />
        <Route path="coupons" element={adminPlaceholder('Coupons')} />
        <Route path="media" element={<AdminMediaPage />} />
        <Route path="users" element={adminPlaceholder('Users')} />
        <Route path="settings" element={adminPlaceholder('Settings')} />
        <Route path="*" element={adminPlaceholder('Not found')} />
      </Route>
    </Routes>
  )
}
