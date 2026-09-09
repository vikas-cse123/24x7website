// Footer content configuration. Destination links are populated dynamically
// from the published destinations API (see FooterDestinations); no
// destination names or URLs are hardcoded here.

export const FOOTER_QUICK_LINKS = [
  { label: 'Blogs', href: '/blogs' },
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
