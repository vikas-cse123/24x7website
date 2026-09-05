import { Container } from '@/components/ui/container'

// Experience is derived from the founding year — never hardcoded, so the
// count advances automatically on January 1 (2026 → "13+", 2027 → "14+").
const FOUNDED_YEAR = 2013
const YEARS_OF_EXPERIENCE = new Date().getFullYear() - FOUNDED_YEAR

// Premium travel strip — emoji icons in uniform centered boxes (consistent
// size/alignment across platforms), existing layout/typography unchanged.
const STATS = [
  {
    icon: '🏆',
    title: `${YEARS_OF_EXPERIENCE}+ Years of Experience — Since ${FOUNDED_YEAR}`,
    color: 'text-[#9A6B2E]', // warm brass/gold – premium, not cheap yellow
  },
  {
    icon: '✈️',
    title: '10k+ Trips Planned',
    color: 'text-[#1E6FA3]', // deep sky – premium travel blue
  },
  {
    icon: '🌍',
    title: '50+ Destinations',
    color: 'text-[#0F766E]', // deep teal – premium, not flat green
  },
]

export function CommunityStats() {
  return (
    <section className="border-y border-emerald-100/60 bg-[#ECFFF5]">
      <Container className="py-2.5">
        {/* Grid capped at 1000px: halves the visual gap between the three
            stat groups (~194px → ~97px at desktop) while keeping dividers. */}
        <div className="grid grid-cols-1 divide-y divide-emerald-100/60 sm:mx-auto sm:max-w-[1000px] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {STATS.map(({ icon, title }) => (
            <div key={title} className="flex items-center justify-center gap-1">
              <span
                aria-hidden="true"
                className="grid h-6 w-6 shrink-0 place-items-center text-[17px] leading-none"
              >
                {icon}
              </span>
              <p className="whitespace-nowrap text-[16px] font-semibold leading-none tracking-tight text-[#0F172A]">
                {title}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
