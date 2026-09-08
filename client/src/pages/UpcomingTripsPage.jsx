import { useQuery } from '@tanstack/react-query'
import { Container } from '@/components/ui/container'
import { TripCard } from '@/components/trips/TripCard'
import { tripApi } from '@/services/trips'
import { WhyChooseUs } from '@/components/home/WhyChooseUs'
import { LovedByTravellers } from '@/components/home/LovedByTravellers'
import { HomepageFaqSection } from '@/components/home/HomepageFaqSection'
import { UPCOMING_TRIPS_FAQS } from '@/lib/homeContent'

const BANNER_SRC = '/api/media/website/category/upcoming-trips.png'

export function UpcomingTripsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['trips', { tripType: 'upcoming_group_trips' }],
    queryFn: () => tripApi.list({ tripType: 'upcoming_group_trips', limit: 24 }),
  })
  const trips = data?.data?.data?.items || []

  return (
    <div className="w-full">
      <section aria-label="Upcoming Group Trips banner" className="w-full">
        <img
          src={BANNER_SRC}
          alt="Upcoming Group Trips"
          className="block h-auto w-full"
          loading="eager"
          decoding="async"
        />
      </section>
      <Container className="py-10">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Upcoming Group Trips</h1>
          <p className="mt-3 text-muted-foreground">Explore our upcoming group departures.</p>
        </div>
      </Container>
      <Container className="pb-10">
        {isLoading ? (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No trips found for this category.</p>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trips.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </div>
        )}
      </Container>
      <WhyChooseUs />
      <LovedByTravellers />
      <HomepageFaqSection items={UPCOMING_TRIPS_FAQS} />
    </div>
  )
}
