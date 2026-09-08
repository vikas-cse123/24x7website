import {
  LayoutDashboard,
  MapPinned,
  Plane,
  Newspaper,
  Users,
  MessageSquare,
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
      { label: 'Destinations', href: '/admin/destinations', icon: MapPinned },
      { label: 'Trips', href: '/admin/trips', icon: Plane },
      { label: 'Blogs', href: '/admin/blogs', icon: Newspaper },
    ],
  },
  {
    section: 'Commerce',
    items: [
      { label: 'Users', href: '/admin/customers', icon: Users },
      { label: 'Enquiries', href: '/admin/enquiries', icon: MessageSquare },
    ],
  },
  {
    section: 'System',
    items: [{ label: 'Settings', href: '/admin/settings', icon: Settings }],
  },
]