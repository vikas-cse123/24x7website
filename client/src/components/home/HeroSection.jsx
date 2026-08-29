import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Plane } from 'lucide-react'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { destinationApi } from '@/services/destinations'
import { BrandLogoImage } from '@/components/brand/BrandLogoImage'

// Homepage hero — travel imagery (real featured destination when available,
// logo fallback otherwise) with the main discovery search.
export function HeroSection() {
  const [query, setQuery] = React.useState('')
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['home','hero','featured-dest'],
    queryFn: () => destinationApi.list({ limit: 1, featured: true }),
    staleTime: 300_000,
  })
  const featured = data?.data?.data?.items?.[0]

  function handleSubmit(e) {
    e.preventDefault()
    navigate(`/trips${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ''}`)
  }

  return (
    <section className="relative flex min-h-[400px] items-center overflow-hidden sm:min-h-[460px]">
      {/* Background imagery */}
      <div className="absolute inset-0" aria-hidden="true">
        {featured?.heroImage?.publicId || featured?.heroImage?.secureUrl || featured?.heroImage?.url ? (
          <DestinationImage
            image={featured.heroImage}
            alt=""
            className="h-full w-full"
            width={1600}
            loading="eager"
          />
        ) : (
          <BrandLogoImage
            aria-hidden="true"
            alt=""
            loading="eager"
            imgClassName="h-full w-full object-cover opacity-[0.06]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-14 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
          <Plane className="h-3.5 w-3.5" />
          Group &amp; customised trips
        </span>

        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Travel the world with 24x7Chhutti
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-foreground/80 sm:text-lg">
          Explore destinations, join group trips with fixed departure dates and
          transparent pricing — around the clock.
        </p>

        <form
          role="search"
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border border-border bg-background p-1.5 shadow-card"
        >
          <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search trips or destinations…"
            aria-label="Search trips and destinations"
            className="h-11 w-full bg-transparent px-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Search
          </button>
        </form>
      </div>
    </section>
  )
}
