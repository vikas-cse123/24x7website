// Centralised navigation structure for the public site.
// Each top-level item maps to a route registered in `client/src/routes/`.
// Items with `children` render as a dropdown (desktop) / expandable group
// (mobile). Add or reorder items here; the Header, MobileNav and Footer all
// consume this config. `icon` is the emoji shown next to each label, except
// the special marker 'indian-flag' which renders the bundled IndianFlag.svg
// asset (see IndianFlagIcon) at the same visual size as the emoji icons.

export const NAV_ITEMS = [
  {
    label: 'Group Trips',
    icon: '👥',
    children: [
      { label: 'International Trips', icon: '✈️', href: '/trips?category=international' },
      { label: 'Domestic Trips', icon: 'indian-flag', href: '/trips?category=domestic' },
    ],
  },
  {
    label: 'Deals',
    icon: '🏷️',
    children: [{ label: 'Northern Lights Early Bird', icon: '🔥', href: '/trips?search=Northern%20Lights' }],
  },
  {
    label: 'Travel Styles',
    icon: '🗺️',
    children: [
      { label: 'Bike Trips', icon: '🏍️', href: '/trips?tripType=bike' },
      { label: 'Spiritual Trips', icon: '🛕', href: '/trips?tripType=spiritual' },
      { label: 'Wellness Retreats', icon: '🧘🏻', href: '/trips?tripType=wellness' },
      { label: 'Treks', icon: '⛰️', href: '/trips?tripType=trek' },
    ],
  },
  { label: 'Upcoming Group Trips', icon: '🧳', href: '/category/upcoming-trips' },
  { label: 'Middle Age Trips', icon: '👫', href: '/category/middle-age-trips' },
  {
    label: 'Customised Trips',
    icon: '🌍',
    children: [
      { label: 'International Trips', icon: '✈️', href: '/trips?category=international' },
      { label: 'Domestic Trips', icon: 'indian-flag', href: '/trips?category=domestic' },
      { label: 'Corporate Trips', icon: '🏫', href: '/trips?tripType=corporate' },
    ],
  },
  {
    label: 'More about us',
    icon: '🏢',
    children: [
      { label: 'Blogs', icon: '📰', href: '/blogs' },
      { label: 'Reviews', icon: '⭐', href: '/#reviews' },
    ],
  },
]

// Footer link groups. Structured so real content can be added later.
// Note: public /destinations listing and the Contact/Privacy/Terms/
// Cancellation pages are removed — no entries here point to them.
export const FOOTER_NAV = {
  destinations: [
    { label: 'Group Trips', href: '/trips' },
    { label: 'Upcoming Group Trips', href: '/trips' },
    { label: 'Travel Blogs', href: '/blogs' },
  ],
  support: [
    { label: 'Travel Blogs', href: '/blogs' },
  ],
  legal: [],
}
