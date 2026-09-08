import * as React from 'react'
import { Routes, Route, useParams, useLocation } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { RequireAdmin } from '@/components/admin/RequireAdmin'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminPlaceholderPage } from '@/pages/admin/AdminPlaceholderPage'

// Route-level code splitting — reduces initial JS from ~862kB to ~180kB.
// Each public/admin page is a separate chunk loaded on demand.
const HomePage = React.lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })))
const DestinationsPage = React.lazy(() => import('@/pages/DestinationsPage').then(m => ({ default: m.DestinationsPage })))
const DestinationPage = React.lazy(() => import('@/pages/DestinationPage').then(m => ({ default: m.DestinationPage })))
const TripsPage = React.lazy(() => import('@/pages/TripsPage').then(m => ({ default: m.TripsPage })))
const TripPage = React.lazy(() => import('@/pages/TripPage').then(m => ({ default: m.TripPage })))
const BookingPage = React.lazy(() => import('@/pages/BookingPage').then(m => ({ default: m.BookingPage })))
const BookingConfirmationPage = React.lazy(() => import('@/pages/BookingConfirmationPage').then(m => ({ default: m.BookingConfirmationPage })))
const BlogsPage = React.lazy(() => import('@/pages/BlogsPage').then(m => ({ default: m.BlogsPage })))
const DestinationBlogsPage = React.lazy(() => import('@/pages/BlogsPage').then(m => ({ default: m.DestinationBlogsPage })))
const BlogDetailPage = React.lazy(() => import('@/pages/BlogDetailPage').then(m => ({ default: m.BlogDetailPage })))
const FaqsPage = React.lazy(() => import('@/pages/FaqsPage').then(m => ({ default: m.FaqsPage })))
const ContactPage = React.lazy(() => import('@/pages/ContactPage').then(m => ({ default: m.ContactPage })))
const PrivacyPolicyPage = React.lazy(() => import('@/pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })))
const TermsPage = React.lazy(() => import('@/pages/TermsPage').then(m => ({ default: m.TermsPage })))
const CancellationPolicyPage = React.lazy(() => import('@/pages/CancellationPolicyPage').then(m => ({ default: m.CancellationPolicyPage })))
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const MiddleAgeTripsPage = React.lazy(() => import('@/pages/MiddleAgeTripsPage').then(m => ({ default: m.MiddleAgeTripsPage })))
const UpcomingTripsPage = React.lazy(() => import('@/pages/UpcomingTripsPage').then(m => ({ default: m.UpcomingTripsPage })))

const AccountLayoutPage = React.lazy(() => import('@/pages/account/AccountLayoutPage').then(m => ({ default: m.AccountLayoutPage })))
const AccountProfilePage = React.lazy(() => import('@/pages/account/AccountProfilePage').then(m => ({ default: m.AccountProfilePage })))
const AccountBookingsPage = React.lazy(() => import('@/pages/account/AccountBookingsPage').then(m => ({ default: m.AccountBookingsPage })))
const AccountBookingDetailPage = React.lazy(() => import('@/pages/account/AccountBookingDetailPage').then(m => ({ default: m.AccountBookingDetailPage })))
const AccountTravellersPage = React.lazy(() => import('@/pages/account/AccountTravellersPage').then(m => ({ default: m.AccountTravellersPage })))
const AccountReviewsPage = React.lazy(() => import('@/pages/account/AccountReviewsPage').then(m => ({ default: m.AccountReviewsPage })))
const AccountWishlistPage = React.lazy(() => import('@/pages/account/AccountWishlistPage').then(m => ({ default: m.AccountWishlistPage })))
const AccountNotificationsPage = React.lazy(() => import('@/pages/account/AccountNotificationsPage').then(m => ({ default: m.AccountNotificationsPage })))

const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const AdminDestinationsPage = React.lazy(() => import('@/pages/admin/AdminDestinationsPage').then(m => ({ default: m.AdminDestinationsPage })))
const AdminDestinationFormPage = React.lazy(() => import('@/pages/admin/AdminDestinationFormPage').then(m => ({ default: m.AdminDestinationFormPage })))
const AdminTripsPage = React.lazy(() => import('@/pages/admin/AdminTripsPage').then(m => ({ default: m.AdminTripsPage })))
const AdminTripFormPage = React.lazy(() => import('@/pages/admin/AdminTripFormPage').then(m => ({ default: m.AdminTripFormPage })))
const AdminBlogsPage = React.lazy(() => import('@/pages/admin/AdminBlogsPage').then(m => ({ default: m.AdminBlogsPage })))
const AdminBlogFormPage = React.lazy(() => import('@/pages/admin/AdminBlogFormPage').then(m => ({ default: m.AdminBlogFormPage })))
const AdminEnquiriesPage = React.lazy(() => import('@/pages/admin/AdminEnquiriesPage').then(m => ({ default: m.AdminEnquiriesPage })))
const AdminSettingsPage = React.lazy(() => import('@/pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })))
const AdminUsersPage = React.lazy(() => import('@/pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })))

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading" />
    </div>
  )
}

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('[RouteErrorBoundary]', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-12 text-center">
          <p className="text-sm text-muted-foreground">This section failed to load.</p>
          <p className="max-w-md text-xs text-muted-foreground/70">{String(this.state.error?.message || this.state.error || '')}</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// /booking/BK-000001 → confirmation; /booking/<trip-slug> → booking wizard.
function BookingRouteSwitch() {
  const { param } = useParams()
  return /^BK-/i.test(param || '') ? <BookingConfirmationPage /> : <BookingPage />
}

function placeholder(title) {
  return <PlaceholderPage title={title} />
}

function adminPlaceholder(title) {
  return <AdminPlaceholderPage title={title} />
}

function ScrollToTop() {
  const { pathname, hash, search } = useLocation()
  React.useEffect(() => {
    if (hash === '#reviews') return
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname, hash, search])
  return null
}

// Public route architecture — all pages are lazy-loaded for performance.
// PublicLayout and auth guards stay eager (small) so navigation is instant.
export function AppRoutes() {
  return (
    <RouteErrorBoundary>
      <React.Suspense fallback={<RouteFallback />}>
        <ScrollToTop />
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
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-and-conditions" element={<TermsPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />

          {/* Marketing / navigation placeholders — keep for backwards compat; nav now points to real routes */}
          <Route path="/group-trips" element={placeholder('Group Trips')} />
          <Route path="/deals" element={placeholder('Deals')} />
          <Route path="/travel-styles" element={placeholder('Travel Styles')} />
          <Route path="/upcoming-trips" element={placeholder('Upcoming Trips')} />
          <Route path="/middle-age-trips" element={placeholder('Middle Age Trips')} />
          <Route path="/customised-trips" element={placeholder('Customised Trips')} />
          <Route path="/more" element={placeholder('More')} />
          <Route path="/category/upcoming-trips" element={<UpcomingTripsPage />} />
          <Route path="/category/middle-age-trips" element={<MiddleAgeTripsPage />} />

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

          {/* Fallback — polished 404 */}
          <Route path="*" element={<NotFoundPage />} />
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
          <Route path="customers" element={<AdminUsersPage />} />
          <Route path="enquiries" element={<AdminEnquiriesPage />} />
          <Route path="blogs" element={<AdminBlogsPage />} />
          <Route path="blogs/new" element={<AdminBlogFormPage mode="create" />} />
          <Route path="blogs/:id/edit" element={<AdminBlogFormPage mode="edit" />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="*" element={adminPlaceholder('Not found')} />
        </Route>
        </Routes>
      </React.Suspense>
    </RouteErrorBoundary>
  )
}
