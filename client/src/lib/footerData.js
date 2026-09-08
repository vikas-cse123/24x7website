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
  { label: 'Blogs', href: '/blogs' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Cancellation Policy', href: '/cancellation-policy' },
  { label: 'Terms & Conditions', href: '/terms-and-conditions' },
]

export const FOOTER_CONTACT = {
  delhi: {
    company: '24x7Chhutti India Pvt Ltd - Delhi',
    address: 'Janak Puri, Delhi, India 110058',
    mapQuery: 'Janak Puri, Delhi, India 110058',
    mobile: '+91-8368653222',
    mobileHref: 'tel:+918368653222',
  },
  gurgaon: {
    company: '24x7Chhutti India Pvt Ltd - Gurgaon',
    address: 'Janak Puri, Delhi, India 110058',
    mapQuery: 'Janak Puri, Delhi, India 110058',
    mobile: '+91-8368653222',
    mobileHref: 'tel:+918368653222',
  },
  support: {
    phone: { label: '99587 23666', href: 'tel:+919958723666' },
    email: { label: '24x7chhutti@gmail.com', href: 'mailto:24x7chhutti@gmail.com' },
    whatsapp: { label: '+91 9310660016', href: 'https://wa.me/919958723666' },
  },
}

export const FOOTER_SOCIALS = [
  { label: 'WhatsApp', href: 'https://wa.me/919958723666?text=Hi%2C%20I%20am%20interested%20in%20your%20trips' },
  { label: 'Instagram', href: 'https://www.instagram.com/24x7chhutti_/' },
  { label: 'Facebook', href: 'https://www.facebook.com/24x7chhutti/' },
]

export const FOOTER_COPYRIGHT =
  '© 2016 - 2026 24x7Chhutti India Pvt Ltd. All rights reserved'
