// Centralised navigation structure for the public site.
// Each top-level item maps to a route registered in `client/src/routes/`.
// Items with `children` render as a dropdown (desktop) / expandable group
// (mobile). Add or reorder items here; the Header, MobileNav and Footer all
// consume this config. `icon` is the emoji shown next to each label.

export const NAV_ITEMS = [
  {
    label: 'Group Trips',
    icon: '👥',
    children: [
      { label: 'International Trips', icon: '✈️', href: '/trips?category=international' },
      { label: 'Domestic Trips', icon: '🇮🇳', href: '/trips?category=domestic' },
    ],
  },
  {
    label: 'Deals',
    icon: '🏷️',
    children: [{ label: 'Northern Lights Early Bird', icon: '🔥', href: '/trips?featured=true' }],
  },
  {
    label: 'Travel Styles',
    icon: '🗺️',
    children: [
      { label: 'Bike Trips', icon: '🏍️', href: '/trips' },
      { label: 'Spiritual Trips', icon: '🛕', href: '/trips' },
      { label: 'The Match Maker', icon: '💌', href: '/trips' },
      { label: 'Wellness Retreats', icon: '🧘🏻', href: '/trips' },
      { label: 'Treks', icon: '⛰️', href: '/trips' },
    ],
  },
  { label: 'Upcoming Group Trips', icon: '🧳', href: '/category/upcoming-trips' },
  { label: 'Middle Age Trips', icon: '👫', href: '/category/middle-age-trips' },
  {
    label: 'Customised Trips',
    icon: '🌍',
    children: [
      { label: 'International Trips', icon: '✈️', href: '/customised-trips?category=international' },
      { label: 'Domestic Trips', icon: '🇮🇳', href: '/customised-trips?category=domestic' },
      { label: 'Corporate Trips', icon: '🏫', href: '/customised-trips?category=corporate' },
    ],
  },
  {
    label: 'More about us',
    icon: '🏢',
    children: [
      { label: 'About 24x7Chhutti', icon: '🏢', href: '/about' },
      { label: 'News and Press', icon: '📰', href: '/blogs' },
      { label: 'Reviews', icon: '⭐', href: '/' },
    ],
  },
]

// Footer link groups. Structured so real content can be added later.
export const FOOTER_NAV = {
  destinations: [
    { label: 'Popular Destinations', href: '/destinations' },
    { label: 'Group Trips', href: '/trips' },
    { label: 'Upcoming Group Trips', href: '/trips' },
    { label: 'Travel Blogs', href: '/blogs' },
  ],
  support: [
    { label: 'Travel Blogs', href: '/blogs' },
    { label: 'FAQs', href: '/faqs' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'About Us', href: '/about' },
    { label: 'Destinations', href: '/destinations' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms-and-conditions' },
    { label: 'Cancellation Policy', href: '/cancellation-policy' },
  ],
}
