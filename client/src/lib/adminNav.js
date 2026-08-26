import {
  LayoutDashboard,
  MapPin,
  Plane,
  CalendarRange,
  Newspaper,
  HelpCircle,
  BookOpen,
  Users,
  MessageSquare,
  Tag,
  Star,
  Image,
  UserCog,
  Settings,
} from 'lucide-react'

// Centralised admin navigation. The sidebar (desktop + mobile) is built from
// this config so sections/items are easy to add later. Items whose features are
// not implemented yet render a clearly marked placeholder page.
export const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  {
    section: 'Content',
    items: [
      { label: 'Destinations', href: '/admin/destinations', icon: MapPin },
      { label: 'Trips', href: '/admin/trips', icon: Plane },
      { label: 'Trip Batches', href: '/admin/trip-batches', icon: CalendarRange },
      { label: 'Blogs', href: '/admin/blogs', icon: Newspaper },
      { label: 'FAQs', href: '/admin/faqs', icon: HelpCircle },
    ],
  },
  {
    section: 'Commerce',
    items: [
      { label: 'Bookings', href: '/admin/bookings', icon: BookOpen },
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Enquiries', href: '/admin/enquiries', icon: MessageSquare },
      { label: 'Coupons', href: '/admin/coupons', icon: Tag },
    ],
  },
  {
    section: 'Engagement',
    items: [
      { label: 'Reviews', href: '/admin/reviews', icon: Star },
      { label: 'Media', href: '/admin/media', icon: Image },
    ],
  },
  {
    section: 'System',
    items: [
      { label: 'Users', href: '/admin/users', icon: UserCog },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
]