import { Users, Star, Heart } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { COMMUNITY_STATS } from '@/lib/homeContent'

const ICONS = { community: Users, travellers: Heart, rating: Star }

// Community / social proof strip. Driven by COMMUNITY_STATS config. Because no
// real business numbers exist yet, values render a clear "coming soon"
// placeholder — never a fabricated statistic.
export function CommunityStats() {
  return (
    <section className="border-y border-border bg-card">
      <Container className="py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {COMMUNITY_STATS.map((stat) => {
            const Icon = ICONS[stat.key] || Users
            return (
              <div key={stat.key} className="flex items-center gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-muted text-primary">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {stat.value ?? '—'}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  {stat.value === null && stat.note && (
                    <p className="text-xs text-muted-foreground/70">{stat.note}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}