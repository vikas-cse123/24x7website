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
    title: 'Travel Solo, Travel Safe',
    emoji: '🧳',
    description:
      'Travel confidently with thoughtfully planned trips, reliable support, and a safe environment from departure to return.',
    icon: Users,
  },
  {
    title: 'Travel With Trusted Partners',
    emoji: '💚',
    description:
      'We work with verified stays, dependable transport, and experienced local partners to keep every journey smooth and secure.',
    icon: ShieldCheck,
  },
  {
    title: 'Experienced Group Captains',
    emoji: '🧑‍✈️',
    description:
      'Our trained trip captains keep the journey organized, welcoming, and hassle-free, so you can focus on enjoying every moment.',
    icon: Sparkles,
  },
  {
    title: 'Clear Pricing, No Surprises',
    emoji: '🍢',
    description:
      'Enjoy transparent pricing with no unnecessary middlemen or hidden charges, giving you better value and a smoother booking experience.',
    icon: PackageX,
  },
  {
    title: 'Trips That Fit Your Vibe',
    emoji: '🤘',
    description:
      'We thoughtfully match trips to traveller groups and preferences, creating experiences that feel comfortable, enjoyable, and right for you.',
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

// Upcoming Group Trips category FAQ (shown on /category/upcoming-trips)
export const UPCOMING_TRIPS_FAQS = [
  {
    question: 'How can I find upcoming solo trips?',
    answer:
      'You can check the websites and social media pages of reputed travel companies that publish upcoming trip calendars. Capture A Trip is one of the best travel company that often publish upcoming solo trips. You can also join them on community groups like Facebook, where upcoming solo travel events are regularly posted.',
  },
  {
    question: 'Can I customize upcoming trips in India?',
    answer:
      'Yes. Many travel companies offer customizable itineraries, where you can change the duration, accommodation type, destinations, and activities.',
  },
  {
    question: 'How far in advance should I book my upcoming trip?',
    answer:
      'One should book the upcoming trips, 2–3 months in advance to secure the spot and get better rates. For off-season travel, 3–4 weeks ahead is usually sufficient, but treks and festival trips may need earlier booking due to limited slots.',
  },
  {
    question: 'Do upcoming group trips include accommodation and meals?',
    answer:
      'Yes, upcoming group trips include accommodation and meals. However, always check the trip itinerary, inclusions, and exclusions list to confirm exactly what\'s provided.',
  },
]

// Middle Age Trips category FAQ (shown on /category/middle-age-trips)
// Q5 "Will there be a trip captain?" omitted — no existing answer found in project, not invented.
export const MIDDLE_AGE_TRIPS_FAQS = [
  {
    question: 'What is the age criteria to join these trips?',
    answer: 'Anyone above 5 years of age and below 50 years can join these trips.',
  },
  {
    question: 'I am a single parent. Can I join with my child?',
    answer: 'Yes, absolutely! Single parents are welcome to join with their kids, provided the child is above 5 years of age.',
  },
  {
    question: 'Are these trips only for people between 35 to 50 years?',
    answer:
      'These trips are specially curated for travellers looking for a mature travel experience. Anyone above 5 years and below 50 years is welcome to join.',
  },
  {
    question: 'Is the trip suitable for first-time travellers?',
    answer:
      'Yes. Our trip captain is there throughout the journey to ensure a smooth and hassle-free experience, making it ideal even for first-time travellers.',
  },
  {
    question: 'Can I book a private room?',
    answer:
      'Yes. You can opt for a Single Sharing Room by paying the applicable additional charges, subject to availability.',
  },
  {
    question: 'What if I have dietary preferences or medical conditions?',
    answer:
      'Please inform us before booking so we can guide you on what’s possible and help make your travel experience as comfortable as we can.',
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