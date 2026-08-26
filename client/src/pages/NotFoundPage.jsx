import { Link } from 'react-router-dom'
import { Compass, Home, Map, Search } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { useSeo } from '@/lib/seo'

export function NotFoundPage() {
  useSeo({
    title: 'Page not found',
    description: 'The page you are looking for does not exist. Explore trips, destinations and travel blogs with 24x7Chhutti.',
    canonical: `${window.location.origin}/404`,
    noindex: true,
  })

  return (
    <Container className="py-14 lg:py-20">
      <div className="mx-auto max-w-3xl text-center">
        {/* Visual */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-muted text-primary">
          <Compass className="h-10 w-10" />
        </div>

        <p className="mt-6 text-sm font-semibold tracking-widest text-primary">404 · Lost on the trail?</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">We could not find that page</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          The link may be broken, the page may have moved, or you may have typed the address incorrectly. Let’s get you back on the right route.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/"><Button size="lg" className="gap-2"><Home className="h-4 w-4" /> Back to home</Button></Link>
          <Link to="/trips"><Button size="lg" variant="outline" className="gap-2"><Map className="h-4 w-4" /> Explore trips</Button></Link>
        </div>

        <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
          <Link to="/destinations" className="group rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Map className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-semibold group-hover:text-primary">Destinations</p>
            <p className="mt-1 text-sm text-muted-foreground">Discover places to travel.</p>
          </Link>
          <Link to="/blogs" className="group rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Search className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-semibold group-hover:text-primary">Travel blogs</p>
            <p className="mt-1 text-sm text-muted-foreground">Guides, tips and stories.</p>
          </Link>
          <Link to="/faqs" className="group rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Compass className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-semibold group-hover:text-primary">FAQs</p>
            <p className="mt-1 text-sm text-muted-foreground">Answers to common questions.</p>
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          If you believe this is an error, <Link to="/contact" className="font-medium text-primary hover:underline">contact support</Link>.
        </p>
      </div>
    </Container>
  )
}
