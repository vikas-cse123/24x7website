import { HeroSection } from '@/components/home/HeroSection'
import { CommunityStats } from '@/components/home/CommunityStats'
import { DestinationExplorer } from '@/components/home/DestinationExplorer'
import { PromoBannerCarousel } from '@/components/home/PromoBannerCarousel'
import { UpcomingTripsSection } from '@/components/home/UpcomingTripsSection'
import { BookWithConfidence } from '@/components/home/BookWithConfidence'
import { VibeWithUs } from '@/components/home/VibeWithUs'
import { WhyChooseUs } from '@/components/home/WhyChooseUs'
import { TrendingDestinations } from '@/components/home/TrendingDestinations'
import { SoloCoupleFriendsBanner } from '@/components/home/SoloCoupleFriendsBanner'
import { ReviewsFromTravellers } from '@/components/home/ReviewsFromTravellers'
import { ReviewsSection } from '@/components/home/ReviewsSection'
import { HomepageFaqSection } from '@/components/home/HomepageFaqSection'
import { LovedByTravellers } from '@/components/home/LovedByTravellers'
import { CommunityMoments } from '@/components/home/CommunityMoments'
import { RelatedBlogs } from '@/components/home/RelatedBlogs'
import { AdventureBanner } from '@/components/home/AdventureBanner'
import { RealityTripsSection } from '@/components/home/RealityTripsSection'
import * as React from 'react'
import { useLocation } from 'react-router-dom'
import { HOMEPAGE_SECTIONS } from '@/lib/homeContent'
import { useSeo } from '@/lib/seo'
import { useUIStore } from '@/stores/ui'

const SECTIONS = {
  hero: <HeroSection />,
  communityStats: <CommunityStats />,
  destinationExplorer: <DestinationExplorer />,
  soloBanner: <SoloCoupleFriendsBanner />,
  promoBannerCarousel: <PromoBannerCarousel />,
  upcomingTrips: <UpcomingTripsSection />,
  bookWithConfidence: <BookWithConfidence />,
  vibeWithUs: <VibeWithUs />,
  whyChooseUs: <WhyChooseUs />,
  trendingDestinations: <TrendingDestinations />,
  reviewsFromTravellers: <ReviewsFromTravellers />,
  reviews: <ReviewsSection />,
  faq: <HomepageFaqSection />,
  lovedByTravellers: <LovedByTravellers />,
  communityMoments: <CommunityMoments />,
  relatedBlogs: <RelatedBlogs />,
  adventureBanner: <AdventureBanner />,
  realityTrips: <RealityTripsSection />,
}

// Above-the-fold sections must render immediately; below-the-fold heavy
// sections (media/API intensive) are deferred until near viewport.
const EAGER_KEYS = new Set(['hero', 'communityStats', 'destinationExplorer', 'soloBanner', 'promoBannerCarousel', 'upcomingTrips'])

function DeferredSection({ children, resetKey }) {
  const ref = React.useRef(null)
  const [visible, setVisible] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || visible) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '400px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [visible, resetKey])
  return (
    <div ref={ref}>{visible ? children : <div className="min-h-[240px]" aria-hidden="true" />}</div>
  )
}

// Real homepage. Sections are composed from HOMEPAGE_SECTIONS order/visibility
// so a future CMS can control them. All data comes from the real Destination and
// Trip APIs — no fabricated business content.
export function HomePage() {
  useSeo({
    title: 'Travel Trips & Destinations',
    description:
      '24x7Chhutti — group and customised trips, destinations, itineraries and transparent pricing, available around the clock.',
    canonical: `${window.location.origin}/`,
  })

  const location = useLocation()
  const isReviewsHash = location.hash === '#reviews'
  const reviewsNavTick = useUIStore((s) => s.reviewsNavTick)
  // Track mobile to scope hash-navigation fixes to mobile (desktop unaffected)
  const [isMobile, setIsMobile] = React.useState(false)
  React.useEffect(() => {
    const m = window.matchMedia('(max-width: 639px)')
    const update = () => setIsMobile(m.matches)
    update()
    m.addEventListener('change', update)
    return () => m.removeEventListener('change', update)
  }, [])

  React.useEffect(() => {
    if (!location.hash) return
    const id = location.hash.slice(1)
    let rafId = 0
    const tryScroll = () => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
      rafId = requestAnimationFrame(tryScroll)
    }
    rafId = requestAnimationFrame(tryScroll)
    return () => cancelAnimationFrame(rafId)
  }, [location.hash, location.key, reviewsNavTick])

  const sections = HOMEPAGE_SECTIONS.order.filter((key) => HOMEPAGE_SECTIONS.visibility[key] !== false)
  // When navigating to #reviews, make all sections up to reviews eager so
  // placeholder heights (240px) don't miscalculate scroll position. Fixes
  // landing at WhyChooseUs/TrendingDestinations.
  const reviewsIndex = HOMEPAGE_SECTIONS.order.indexOf('reviewsFromTravellers')

  return (
    <div>
      {sections.map((key) => {
        const node = SECTIONS[key]
        const idx = HOMEPAGE_SECTIONS.order.indexOf(key)
        const eager = EAGER_KEYS.has(key) || (isReviewsHash && idx !== -1 && idx <= reviewsIndex)
        // On mobile, sections BELOW reviews were left as deferred placeholders
        // while above were expanded to eager. The layout shift made their
        // IntersectionObservers stale and they could remain blank after the
        // programmatic scroll. Recreate observers for below sections on hash
        // navigation (mobile only) so they fire at correct positions as user
        // scrolls, without resetting already-visible sections.
        // Use reviewsNavTick so repeated clicks while already at /#reviews
        // (which previously used history.pushState and left location.key
        // unchanged) still trigger a fresh observer.
        const isBelowReviews = isReviewsHash && isMobile && idx > reviewsIndex
        const resetKey = isBelowReviews ? `${location.key}-${reviewsNavTick}` : undefined
        return (
          <div key={key}>
            {eager ? node : <DeferredSection resetKey={resetKey}>{node}</DeferredSection>}
          </div>
        )
      })}
    </div>
  )
}