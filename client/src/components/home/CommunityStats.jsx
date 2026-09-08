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
    title: `${YEARS_OF_EXPERIENCE}+ Years of Experience`,
    subtitle: `Since ${FOUNDED_YEAR}`,
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
        <div className="grid grid-cols-[1.55fr_0.725fr_0.725fr] divide-x divide-emerald-100/60 sm:grid-cols-3">
          {STATS.map(({ icon, title, subtitle }) => (
            <div key={title} className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-center sm:flex-row sm:gap-1.5 sm:px-1 sm:py-1">
              {subtitle ? (
                <>
                  {/* Mobile: icon inline with title only */}
                  <div className="flex items-center justify-center gap-1 sm:hidden">
                    <span aria-hidden="true" className="grid h-4 w-4 shrink-0 place-items-center text-[13px] leading-none">
                      {icon}
                    </span>
                    <span className="whitespace-nowrap text-[11px] font-semibold leading-tight tracking-tight text-[#0F172A]">{title}</span>
                  </div>
                  {/* Desktop/tablet: single line */}
                  <div className="hidden sm:flex sm:items-center sm:gap-1.5">
                    <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center text-[17px] leading-none">
                      {icon}
                    </span>
                    <p className="whitespace-nowrap text-[13px] font-semibold leading-tight tracking-tight text-[#0F172A]">
                      {title} — {subtitle}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Mobile: icon inline, centered */}
                  <div className="flex items-center justify-center gap-1 sm:hidden">
                    <span aria-hidden="true" className="grid h-4 w-4 shrink-0 place-items-center text-[13px] leading-none">
                      {icon}
                    </span>
                    <span className="whitespace-nowrap text-[11px] font-semibold leading-tight tracking-tight text-[#0F172A]">{title}</span>
                  </div>
                  {/* Desktop: icon + title */}
                  <div className="hidden sm:flex sm:items-center sm:gap-1.5">
                    <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center text-[17px] leading-none">
                      {icon}
                    </span>
                    <p className="whitespace-nowrap text-[13px] font-semibold leading-tight tracking-tight text-[#0F172A]">{title}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
