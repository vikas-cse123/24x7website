// Centralised navigation structure for the public site.
// Each top-level item maps to a route registered in `client/src/routes/`.
// Items with `children` render as a dropdown (desktop) / expandable group
// (mobile). Add or reorder items here; the Header, MobileNav and Footer all
// consume this config.

export const NAV_ITEMS = [
  { label: 'Group Trips', href: '/trips' },
  { label: 'Deals', href: '/trips?featured=true' },
  { label: 'Travel Styles', href: '/trips' },
  { label: 'Upcoming Group Trips', href: '/trips' },
  { label: 'Destinations', href: '/destinations' },
  {
    label: 'More',
    href: '/more',
    children: [
      { label: 'Travel Blogs', href: '/blogs' },
      { label: 'FAQs', href: '/faqs' },
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
]

// Footer link groups. Structured so real content can be added later.
export const FOOTER_NAV = {
  destinations: [
    { label: 'Popular Destinations', href: '/destinations' },
    { label: 'Group Trips', href: '/trips' },
    { label: 'Upcoming Group Trips', href: '/trips' },
  ],
  support: [
    { label: 'Travel Blogs', href: '/blogs' },
    { label: 'FAQs', href: '/faqs' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'About Us', href: '/about' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms' },
  ],
}
