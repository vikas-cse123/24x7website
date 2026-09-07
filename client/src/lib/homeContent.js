import {
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
// data so a future CMS can manage them (benefits, USPs, FAQs, section
// visibility/order) without code changes. Nothing here invents business numbers
// — where real data does not exist yet, the section renders a clean
// placeholder/empty state (see each section component).
// ---------------------------------------------------------------------------

// 4. Community / social proof. `value: null` means the number is not known yet —
//    the section shows a "coming soon" placeholder instead of a fake statistic.
export const COMMUNITY_STATS = [
  { key: 'community', label: 'Community size', value: null, note: 'Coming soon' },
  { key: 'travellers', label: 'Travellers', value: null, note: 'Coming soon' },
  { key: 'rating', label: 'Average rating', value: null, note: 'Coming soon' },
]

// 7. Book with Confidence benefit strip (reference-style: playful icon + bold
// line). `icon` is an emoji — matches the site's emoji icon language (nav,
// stats strip) and echoes the reference's colorful illustration style.
export const CONFIDENCE_BENEFITS = [
  {
    title: 'Secure Your Spot by Paying 20% of the Trip',
    description: 'Secure your spot with a small initial payment and pay the balance later.',
    icon: '🛡️',
  },
  {
    title: 'Book Your Trip on Easy Zero-Cost EMI',
    description: 'Split your trip cost into easy monthly instalments where available.',
    icon: '💳',
  },
  {
    title: 'Free Cancellation on Group Trips',
    description: 'Clear and fair cancellation policies on group trips.',
    icon: '🚫',
  },
  {
    title: 'Reschedule at No Extra Charges',
    description: 'Reschedule your departure at no extra cost.',
    icon: '🔄',
  },
  {
    title: '24*7 Support & Trained Trip Captains',
    description: 'Trained trip captains and round-the-clock assistance throughout your trip.',
    icon: '🎧',
  },
]

// 8. Reasons / USP cards ("Reasons To Make Us Your Travel Bestie").
// `emoji` drives the homepage card style; `icon` (Lucide) remains for the
// About page, which renders the same values in its own layout.
export const WHY_CHOOSE_US = [
  {
    title: 'Solo is safe.',
    emoji: '🧳',
    description:
      "Girlies, you're safe AF. No need to wait on fam or besties—just pack and go! Explore stress-free with 100% freedom!",
    icon: Users,
  },
  {
    title: "We're the greenest flag.",
    emoji: '💚',
    description:
      'We ensure safety with verified stays, reliable transport, and trained guides for a secure, comfy, and hassle-free trip.',
    icon: ShieldCheck,
  },
  {
    title: 'Our Group Captains are fire.',
    emoji: '🧑‍✈️',
    description:
      'Our awesome trip captains are part-guide, part-friend and full time vibe curators.',
    icon: Sparkles,
  },
  {
    title: 'No kebab main haddi.',
    emoji: '🍢',
    description:
      'No middlemen, no hidden fees. Enjoy direct bookings, lower costs, and personalized support for a seamless and affordable trip.',
    icon: PackageX,
  },
  {
    title: 'Vibe check comes first.',
    emoji: '🤘',
    description:
      "We customize your trips based on age groups, so you're not stuck vibing to someone else's playlist without permission.",
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
    'hero',
    'communityStats',
    'destinationExplorer',
    'soloBanner',
    'upcomingTrips',
    'promoBannerCarousel',
    'bookWithConfidence',
    'vibeWithUs',
    'whyChooseUs',
    'trendingDestinations',
    'reviewsFromTravellers',
    'faq',
    'lovedByTravellers',
    'reviews',
    'communityMoments',
    'relatedBlogs',
    'adventureBanner',
    'realityTrips',
  ],
  visibility: {
    hero: true,
    // Stats/reputation strip rendered immediately below the Home Video
    // (hero) section and above Explore Destinations.
    communityStats: true,
    destinationExplorer: true,
    soloBanner: true,
    promoBannerCarousel: true,
    upcomingTrips: true,
    bookWithConfidence: true,
    vibeWithUs: true,
    whyChooseUs: true,
    trendingDestinations: true,
    reviewsFromTravellers: true,
    reviews: false,
    faq: true,
    lovedByTravellers: true,
    communityMoments: false,
    relatedBlogs: true,
    // Replaced by the large "Adventure awaits you." area built into the footer.
    adventureBanner: false,
    // Hidden per request: "The Reality Of A Trip" placeholder section removed
    // from the homepage (videos not available yet).
    realityTrips: false,
  },
}

// Destinations category tabs (market segments) used by the explorer + trip tabs.
export const DESTINATION_CATEGORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'international', label: 'International' },
  { key: 'domestic', label: 'Domestic' },
  { key: 'weekend', label: 'Weekend' },
]