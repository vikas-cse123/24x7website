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

function DeferredSection({ children }) {
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
  }, [visible])
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

  React.useEffect(() => {
    if (!location.hash) return
    const id = location.hash.slice(1)
    // wait for deferred sections to mount
    const t = setTimeout(() => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => clearTimeout(t)
  }, [location.hash])

  const sections = HOMEPAGE_SECTIONS.order.filter((key) => HOMEPAGE_SECTIONS.visibility[key] !== false)

  return (
    <div>
      {sections.map((key) => {
        const node = SECTIONS[key]
        const eager = EAGER_KEYS.has(key) || (isReviewsHash && key === 'reviewsFromTravellers')
        return (
          <div key={key}>{eager ? node : <DeferredSection>{node}</DeferredSection>}</div>
        )
      })}
    </div>
  )
}