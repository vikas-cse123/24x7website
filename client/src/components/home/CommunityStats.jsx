import { Container } from '@/components/ui/container'

// Slim horizontal trust/stats strip directly below the hero video.
// Three compact items (icon + single-line text), evenly distributed and
// centered across the page. No subtitles, no large cards.
const STATS = [
  {
    icon: '🏆',
    title: '13+ Years of Experience — Since 2013',
  },
  {
    icon: '✈️',
    title: '10k+ Trips Planned',
  },
  {
    icon: '🌍',
    title: '50+ Destinations',
  },
]

export function CommunityStats() {
  return (
    <section className="border-y border-border bg-background">
      <Container className="py-3.5">
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 text-center sm:grid-cols-3 sm:gap-8">
          {STATS.map((stat) => (
            <div key={stat.title} className="flex items-center justify-center gap-3">
              <span
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base"
                aria-hidden="true"
              >
                {stat.icon}
              </span>
              <p className="text-sm font-semibold text-foreground sm:text-base">{stat.title}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}