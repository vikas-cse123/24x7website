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
    title: '10K+ Travellers',
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
      <Container className="px-3 py-2 sm:px-6 sm:py-2.5">
        <div className="grid grid-cols-3 divide-x divide-emerald-100/60">
          {STATS.map(({ icon, title }) => (
            <div key={title} className="flex flex-col items-center justify-center gap-0.5 px-1 py-1 text-center sm:flex-row sm:gap-1.5 sm:py-1">
              <span
                aria-hidden="true"
                className="grid h-5 w-5 shrink-0 place-items-center text-[14px] leading-none sm:h-6 sm:w-6 sm:text-[17px]"
              >
                {icon}
              </span>
              <p className="line-clamp-2 text-center text-[11px] font-semibold leading-tight tracking-tight text-[#0F172A] sm:whitespace-nowrap sm:text-[13px]">
                {title}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
