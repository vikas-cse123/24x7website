import {
  Wallet,
  CreditCard,
  CalendarX,
  RefreshCcw,
  Headphones,
  Sparkles,
  ShieldCheck,
  Users,
  HeartHandshake,
  PackageX,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Homepage content configuration.
//
// These are the configurable marketing/homepage content blocks. They are plain
// data so a future CMS can manage them (promo banner, benefits, USPs, FAQs,
// section visibility/order) without code changes. Nothing here invents business
// numbers — where real data does not exist yet, the section renders a clean
// placeholder/empty state (see each section component).
// ---------------------------------------------------------------------------

// 1. Top promotional / announcement bar.
export const PROMO_BANNER_CONFIG = {
  enabled: true,
  dismissible: true,
  text: 'Early Bird Sale — Save on upcoming group trips',
  ctaLabel: 'Explore trips',
  ctaHref: '/trips',
}

// 4. Community / social proof. `value: null` means the number is not known yet —
//    the section shows a "coming soon" placeholder instead of a fake statistic.
export const COMMUNITY_STATS = [
  { key: 'community', label: 'Community size', value: null, note: 'Coming soon' },
  { key: 'travellers', label: 'Travellers', value: null, note: 'Coming soon' },
  { key: 'rating', label: 'Average rating', value: null, note: 'Coming soon' },
]

// 7. Book with Confidence benefit cards.
export const CONFIDENCE_BENEFITS = [
  {
    title: 'Low upfront payment',
    description: 'Secure your spot with a small initial payment and pay the balance later.',
    icon: Wallet,
  },
  {
    title: 'Easy EMI options',
    description: 'Split your trip cost into easy monthly instalments where available.',
    icon: CreditCard,
  },
  {
    title: 'Flexible cancellation',
    description: 'Clear and fair cancellation options on group trips.',
    icon: CalendarX,
  },
  {
    title: 'Free rescheduling',
    description: 'Reschedule your departure to another date at no extra charge.',
    icon: RefreshCcw,
  },
  {
    title: '24x7 support & trip captains',
    description: 'Trained trip captains and round-the-clock assistance throughout your trip.',
    icon: Headphones,
  },
]

// 8. Reasons / USP cards.
export const WHY_CHOOSE_US = [
  {
    title: 'Solo travel is safe',
    description: 'No need to wait for family or friends. Pack your bags and join a group of like-minded travellers.',
    icon: Users,
  },
  {
    title: 'Verified stays & transport',
    description: 'We work with verified stays and reliable transport for a comfortable, hassle-free trip.',
    icon: ShieldCheck,
  },
  {
    title: 'Trained trip captains',
    description: 'Our captains are part guide, part friend, and full-time experience curators.',
    icon: Sparkles,
  },
  {
    title: 'Transparent pricing',
    description: 'No hidden fees, no middlemen. Direct bookings at fair prices.',
    icon: PackageX,
  },
  {
    title: 'Vibe-matched groups',
    description: 'Trips are built around age groups and interests so the energy matches.',
    icon: HeartHandshake,
  },
]

// 11. Homepage FAQ content (original 24x7Chhutti copy).
export const HOMEPAGE_FAQS = [
  {
    question: 'What is 24x7Chhutti?',
    answer:
      '24x7Chhutti is a travel platform that offers group and customised trips with clear itineraries, fixed departure dates and transparent pricing.',
  },
  {
    question: 'Who can join a trip?',
    answer:
      'Anyone above the minimum age for the trip. Solo travellers, couples and friends are all welcome.',
  },
  {
    question: 'Can solo travellers join group trips?',
    answer:
      'Yes. Most of our group trips are solo-friendly, and you will travel with a group of like-minded people.',
  },
  {
    question: 'What is the group size?',
    answer:
      'Group sizes vary by trip and are listed on each trip page. We keep groups small enough for a personal experience.',
  },
  {
    question: 'What is included in the trip package?',
    answer:
      'Inclusions such as stays, transport, meals and activities are listed on every trip page. Anything not included is listed under exclusions.',
  },
  {
    question: 'Is it safe to travel with 24x7Chhutti?',
    answer:
      'We use verified stays, reliable transport and trained trip captains, and our support team is available around the clock.',
  },
  {
    question: 'Can I customise my trip?',
    answer:
      'Yes, we offer customised trips. Contact us with your requirements and we will plan it for you.',
  },
  {
    question: 'What are the payment options?',
    answer:
      'Payment options include a low upfront payment with the balance due later, and EMI where available. Details are shown at booking.',
  },
  {
    question: 'How can I contact support?',
    answer:
      'Our support team is available 24x7 through the contact options on this website.',
  },
]

// 15. Homepage section visibility + order. A future CMS can manage this.
export const HOMEPAGE_SECTIONS = {
  order: [
    'promoBanner',
    'hero',
    'communityStats',
    'destinationExplorer',
    'upcomingTrips',
    'bookWithConfidence',
    'whyChooseUs',
    'trendingDestinations',
    'reviews',
    'faq',
    'communityMoments',
    'relatedBlogs',
    'realityTrips',
  ],
  visibility: {
    promoBanner: true,
    hero: true,
    communityStats: true,
    destinationExplorer: true,
    upcomingTrips: true,
    bookWithConfidence: true,
    whyChooseUs: true,
    trendingDestinations: true,
    reviews: true,
    faq: true,
    communityMoments: true,
    relatedBlogs: true,
    realityTrips: true,
  },
}

// Destinations category tabs (market segments) used by the explorer + trip tabs.
export const DESTINATION_CATEGORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'international', label: 'International' },
  { key: 'domestic', label: 'Domestic' },
  { key: 'weekend', label: 'Weekend' },
]