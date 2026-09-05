// Footer content configuration. Destination labels are grouped column-by-column
// exactly as they should appear in the footer grid. Each label is resolved to a
// real destination page (`/destination/<slug>`) when a matching destination
// exists in the API; otherwise it falls back to the trips listing for its
// category.

export const DOMESTIC_TRIP_COLUMNS = [
  ['Meghalaya Tour Packages', 'Kashmir Tour Packages', 'Andaman Tour Packages'],
  ['Spiti Tour Packages', 'Ladakh Tour Packages'],
  ['Himachal Tour Packages', 'Rajasthan Tour Packages'],
  ['Tawang Tour Packages', 'Kedarnath Tour Packages'],
  ['Uttarakhand Tour Packages', 'Kerala Tour Packages'],
]

export const INTERNATIONAL_TRIP_COLUMNS = [
  [
    'Northern Lights Tour Packages',
    'Almaty Tour Packages',
    'Japan Tour Packages',
    'Mauritius Tour Packages',
  ],
  [
    'Georgia Tour Packages',
    'Thailand Tour Packages',
    'Sri Lanka Tour Packages',
    'Malaysia Tour Packages',
  ],
  ['Vietnam Tour Packages', 'Dubai Tour Packages', 'Nepal Tour Packages'],
  ['Bali Tour Packages', 'Cambodia Tour Packages', 'Maldives Tour Packages'],
  ['Europe Tour Packages', 'Bhutan Tour Packages', 'Singapore Tour Packages'],
]

export const FOOTER_QUICK_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Blogs', href: '/blogs' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Cancellation Policy', href: '/cancellation-policy' },
  { label: 'Terms & Conditions', href: '/terms-and-conditions' },
  { label: 'Wellness Retreats', href: '/trips' },
  { label: 'Corporate Tours', href: '/customised-trips?category=corporate' },
  { label: 'News and Press', href: '/blogs' },
]

export const FOOTER_CONTACT = {
  delhi: {
    company: 'Capture a Trip India Pvt Ltd - Delhi',
    address:
      '1473-G-NN-1/9619, Brahm Gali, West Rohtash Nagar, Shahdara, New Delhi -110032',
  },
  gurgaon: {
    company: 'CaptureTrip India Pvt Ltd - Gurgaon',
    address:
      'Plot No. 602A, Udyog Vihar, Phase V, Gurugram, Haryana - 122016',
    mapQuery:
      'Plot No. 602A, Udyog Vihar, Phase V, Gurugram, Haryana 122016',
    mobile: '+91-8368653222',
    mobileHref: 'tel:+918368653222',
  },
  support: {
    phone: { label: '+91 8287636079', href: 'tel:+918287636079' },
    email: { label: 'info@captureatrip.com', href: 'mailto:info@captureatrip.com' },
    whatsapp: { label: '+91 9310660016', href: 'https://wa.me/919310660016' },
  },
}

export const FOOTER_SOCIALS = [
  { label: 'WhatsApp', href: 'https://wa.me/919310660016' },
  { label: 'Instagram', href: '#' },
  { label: 'Facebook', href: '#' },
  { label: 'LinkedIn', href: '#' },
  { label: 'X', href: '#' },
  { label: 'YouTube', href: '#' },
]

export const FOOTER_COPYRIGHT =
  '© 2016 - 2026 Capture A Trip India Pvt Ltd. All rights reserved'
