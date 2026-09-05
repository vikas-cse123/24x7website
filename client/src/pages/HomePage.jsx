import { HeroSection } from '@/components/home/HeroSection'
import { CommunityStats } from '@/components/home/CommunityStats'
import { DestinationExplorer } from '@/components/home/DestinationExplorer'
import { PromoBannerCarousel } from '@/components/home/PromoBannerCarousel'
import { UpcomingTripsSection } from '@/components/home/UpcomingTripsSection'
import { PlanTripCta } from '@/components/home/PlanTripCta'
import { BookWithConfidence } from '@/components/home/BookWithConfidence'
import { VibeWithUs } from '@/components/home/VibeWithUs'
import { WhyChooseUs } from '@/components/home/WhyChooseUs'
import { TrendingDestinations } from '@/components/home/TrendingDestinations'
import { ReviewsFromTravellers } from '@/components/home/ReviewsFromTravellers'
import { ReviewsSection } from '@/components/home/ReviewsSection'
import { HomepageFaqSection } from '@/components/home/HomepageFaqSection'
import { LovedByTravellers } from '@/components/home/LovedByTravellers'
import { CommunityMoments } from '@/components/home/CommunityMoments'
import { RelatedBlogs } from '@/components/home/RelatedBlogs'
import { AdventureBanner } from '@/components/home/AdventureBanner'
import { RealityTripsSection } from '@/components/home/RealityTripsSection'
import { HOMEPAGE_SECTIONS } from '@/lib/homeContent'
import { useSeo } from '@/lib/seo'

const SECTIONS = {
  hero: <HeroSection />,
  communityStats: <CommunityStats />,
  destinationExplorer: <DestinationExplorer />,
  promoBannerCarousel: <PromoBannerCarousel />,
  upcomingTrips: <UpcomingTripsSection />,
  planTripCta: <PlanTripCta />,
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

  const sections = HOMEPAGE_SECTIONS.order.filter((key) => HOMEPAGE_SECTIONS.visibility[key] !== false)

  return (
    <div>
      {sections.map((key) => (
        <div key={key}>{SECTIONS[key]}</div>
      ))}
    </div>
  )
}