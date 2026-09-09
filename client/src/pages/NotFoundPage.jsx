import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Home,
  Map,
  MapPin,
  Luggage,
  ArrowRight,
} from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { destinationApi } from '@/services/destinations'
import { useSeo } from '@/lib/seo'

// Wooden travel signpost in a quiet mountain landscape. Flat, minimal shapes
// in muted greens — no external assets, no animation.
function SignpostIllustration() {
  return (
    <svg
      viewBox="0 0 480 250"
      role="img"
      aria-label="A wooden signpost pointing toward good trips"
      className="mx-auto h-auto w-full max-w-[420px]"
    >
      <circle cx="240" cy="118" r="108" fill="#EAF4EE" />
      <path
        d="M150 66 q6 -6 12 0 q6 -6 12 0"
        fill="none"
        stroke="#94A3B8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M312 50 q5 -5 10 0 q5 -5 10 0"
        fill="none"
        stroke="#94A3B8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M40 178 L140 76 L200 142 L280 62 L360 152 L440 102 L440 178 Z"
        fill="#D9E5DD"
      />
      <polygon points="140,76 158,96 140,92 122,96" fill="#FFFFFF" />
      <polygon points="280,62 300,84 280,79 260,84" fill="#FFFFFF" />
      <path
        d="M0 202 Q120 152 240 186 T480 182 L480 250 L0 250 Z"
        fill="#CBE3D2"
      />
      <ellipse cx="240" cy="224" rx="92" ry="10" fill="#BFD9C6" opacity="0.6" />
      <g>
        <rect x="100" y="176" width="5" height="18" fill="#8A6248" />
        <polygon points="102.5,150 84,178 121,178" fill="#6FA287" />
        <polygon points="102.5,162 88,182 117,182" fill="#5E9B6F" />
      </g>
      <g>
        <rect x="378" y="180" width="5" height="16" fill="#8A6248" />
        <polygon points="380.5,156 364,182 397,182" fill="#6FA287" />
        <polygon points="380.5,167 368,186 393,186" fill="#5E9B6F" />
      </g>
      <rect x="234" y="92" width="12" height="128" rx="3" fill="#A0785A" />
      <rect x="242" y="92" width="4" height="128" rx="2" fill="#8A6248" opacity="0.55" />
      <polygon
        points="150,100 310,100 330,114 310,128 150,128"
        fill="#FFFDF4"
        stroke="#E3D5B8"
        strokeWidth="1.5"
      />
      <polygon
        points="330,138 170,138 150,152 170,166 330,166"
        fill="#FFFDF4"
        stroke="#E3D5B8"
        strokeWidth="1.5"
      />
      <polygon
        points="200,176 300,176 314,188 300,200 200,200"
        fill="#FFFDF4"
        stroke="#E3D5B8"
        strokeWidth="1.5"
      />
      <text
        x="232"
        y="119"
        textAnchor="middle"
        fontSize="14"
        fontWeight="600"
        fill="#1B4332"
        fontFamily="inherit"
      >
        Good Trips
      </text>
      <text
        x="248"
        y="157"
        textAnchor="middle"
        fontSize="14"
        fontWeight="600"
        fill="#1B4332"
        fontFamily="inherit"
      >
        This Way
      </text>
      <text
        x="250"
        y="193"
        textAnchor="middle"
        fontSize="12"
        fontWeight="600"
        fill="#1B4332"
        fontFamily="inherit"
      >
        Not Here
      </text>
    </svg>
  )
}

function NavCard({ to, icon: Icon, title, subtitle }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-900 group-hover:text-primary">
          {title}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  )
}

export function NotFoundPage() {
  useSeo({
    title: 'Page not found',
    description: 'The page you are looking for does not exist. Explore trips, destinations and travel blogs with 24x7Chhutti.',
    canonical: `${window.location.origin}/404`,
    noindex: true,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['not-found', 'destinations'],
    queryFn: () => destinationApi.list({ limit: 6 }),
    staleTime: 5 * 60 * 1000,
  })
  const popularDestinations = (data?.data?.data?.items || []).filter((d) => d?.slug && d?.name)

  return (
    <Container className="py-12 lg:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <SignpostIllustration />

        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-primary">
          404 · Page not found
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Looks like this destination doesn&apos;t exist.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          The page you&apos;re looking for may have moved, been deleted, or the address
          could be incorrect. Let&apos;s help you find your way back to your next adventure.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/">
            <Button size="lg" className="w-full gap-2 sm:w-auto">
              <Home className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <Link to="/trips">
            <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto">
              <Map className="h-4 w-4" /> Explore Trips
            </Button>
          </Link>
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Where would you like to go instead?
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
            <NavCard
              to="/trips"
              icon={MapPin}
              title="Explore Destinations"
              subtitle="Browse trips by destination"
            />
            <NavCard
              to="/category/upcoming-trips"
              icon={Luggage}
              title="Upcoming Trips"
              subtitle="Group departures with live pricing"
            />
          </div>

          {popularDestinations.length > 0 && (
            <div className="mt-8">
              <p className="text-sm font-semibold text-slate-900">Popular Destinations</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {popularDestinations.map((d) => (
                  <Link
                    key={d.slug}
                    to={`/destination/${d.slug}`}
                    className="shrink-0 rounded-full border border-input bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {d.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {isLoading && (
            <div className="mt-8" aria-hidden="true">
              <div className="mx-auto h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-muted" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}
