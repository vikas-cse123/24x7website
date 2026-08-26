import { Link } from 'react-router-dom'
import { MapPin, Users, ShieldCheck, Sparkles, HeartHandshake, Clock3, Mountain, Compass } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { WHY_CHOOSE_US } from '@/lib/homeContent'
import { useSeo } from '@/lib/seo'

const STATS = [
  { value: '24×7', label: 'Support available' },
  { value: 'Group + Custom', label: 'Trip formats' },
  { value: 'India', label: 'Based in' },
]

const JOURNEY_STEPS = [
  { title: 'Discover', description: 'Browse destinations, trip types and departure dates in one place.', icon: Compass },
  { title: 'Book with confidence', description: 'Transparent pricing, clear inclusions and flexible options.', icon: ShieldCheck },
  { title: 'Travel together', description: 'Join vibe-matched groups led by trained trip captains.', icon: Users },
]

export function AboutPage() {
  useSeo({
    title: 'About Us',
    description: 'Learn about 24x7Chhutti — group and customised trips with transparent pricing, verified stays and around-the-clock support.',
    canonical: `${window.location.origin}/about`,
  })

  return (
    <div>
      {/* Breadcrumb */}
      <Container className="pt-6">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex items-center gap-1.5">
            <li><Link to="/" className="hover:text-foreground hover:underline">Home</Link></li>
            <li aria-hidden="true" className="text-muted-foreground/60">/</li>
            <li aria-current="page" className="font-medium text-foreground">About Us</li>
          </ol>
        </nav>
      </Container>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-brand-muted via-background to-muted/40">
        <Container className="py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary">
                <Sparkles className="h-3.5 w-3.5" /> About 24x7Chhutti
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Travel that feels easy, safe and memorable
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                24x7Chhutti is a travel platform for group and customised trips — with fixed departure dates, clear itineraries and honest pricing. We bring solo travellers, friends and couples together into vibe-matched groups.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/trips"><Button size="lg">Explore trips</Button></Link>
                <Link to="/contact"><Button size="lg" variant="outline">Contact us</Button></Link>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6 sm:gap-6">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <p className="text-lg font-bold tracking-tight sm:text-xl">{s.value}</p>
                    <p className="text-xs text-muted-foreground sm:text-sm">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/15 via-brand-muted to-muted p-6 flex flex-col justify-end">
                  <div className="rounded-xl bg-background/90 p-4 backdrop-blur shadow-card">
                    <p className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4 text-primary" /> Destinations across India & beyond</p>
                    <p className="mt-1 text-sm text-muted-foreground">Weekend escapes, domestic circuits and international group trips — all with trip captains and verified stays.</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-card">
                  <div className="p-4 text-center">
                    <Mountain className="mx-auto h-5 w-5 text-primary" />
                    <p className="mt-1 text-xs font-medium">Mountains</p>
                  </div>
                  <div className="p-4 text-center">
                    <Clock3 className="mx-auto h-5 w-5 text-primary" />
                    <p className="mt-1 text-xs font-medium">Fixed departures</p>
                  </div>
                  <div className="p-4 text-center">
                    <HeartHandshake className="mx-auto h-5 w-5 text-primary" />
                    <p className="mt-1 text-xs font-medium">Group vibe</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Who we are */}
      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Who we are</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We started 24x7Chhutti to make group travel simpler — no endless coordination, no hidden costs and no waiting for the “perfect time”. Our trips are built around real departure dates, well-planned itineraries and transparent inclusions so you know exactly what you are booking.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Whether you are a solo traveller joining for the first time, a couple looking for a hassle-free getaway, or friends planning together — you will find a group that matches your energy.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" /><span><strong>Available around the clock</strong> — trip discovery, booking and support, 24×7.</span></li>
              <li className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" /><span><strong>Real departure dates</strong> — browse upcoming batches and choose the date that works for you.</span></li>
              <li className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" /><span><strong>Honest pricing</strong> — what you see is what you pay, with clear inclusions and exclusions.</span></li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-6 lg:p-8">
            <h3 className="text-lg font-semibold">How it works</h3>
            <div className="mt-6 space-y-5">
              {JOURNEY_STEPS.map((step, idx) => {
                const Icon = step.icon
                return (
                  <div key={step.title} className="flex gap-4">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold"><span className="text-muted-foreground mr-1">{idx + 1}.</span> {step.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <Link to="/faqs" className="mt-6 inline-flex text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
              Read FAQs →
            </Link>
          </div>
        </div>
      </Container>

      {/* Why choose us */}
      <section className="border-y border-border bg-muted/30 py-12 lg:py-16">
        <Container>
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Why travellers choose 24x7Chhutti</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">The same values we promise on every group trip.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_CHOOSE_US.map((usp) => {
              const Icon = usp.icon
              return (
                <div key={usp.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-primary"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-3 text-sm font-semibold">{usp.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{usp.description}</p>
                </div>
              )
            })}
          </div>
        </Container>
      </section>

      {/* Travel experience / value prop */}
      <Container className="py-12 lg:py-16">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">A travel experience you can trust</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Verified stays, reliable transport and trained trip captains are the backbone of every 24x7Chhutti trip. We keep groups small enough to feel personal and large enough to feel lively — with support available throughout your journey.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Verified partners</p>
                  <p className="mt-1 text-sm text-muted-foreground">Stays and transport vetted for comfort and safety.</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Small, vibe-matched groups</p>
                  <p className="mt-1 text-sm text-muted-foreground">Travel with like-minded people; solos are welcome.</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-primary/10 via-brand-muted to-muted p-6">
              <p className="text-sm font-semibold">Need help choosing?</p>
              <p className="mt-1 text-sm text-muted-foreground">Tell us your dates, budget and style — our team will suggest the right trip.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/contact"><Button>Talk to us</Button></Link>
                <Link to="/trips"><Button variant="outline">Browse trips</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* CTA */}
      <section className="bg-primary py-12 text-primary-foreground lg:py-16">
        <Container className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ready to travel?</h2>
          <p className="mx-auto mt-2 max-w-xl text-primary-foreground/90">Find your next group trip or destination and book in minutes.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/trips"><Button variant="secondary" size="lg">Explore trips</Button></Link>
            <Link to="/destinations"><Button variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">View destinations</Button></Link>
          </div>
        </Container>
      </section>
    </div>
  )
}
