import * as React from 'react'
import { Container } from '@/components/ui/container'
import { BRAND_LOGO_FALLBACK, BRAND_NAME } from '@/lib/branding'

const FOUNDED_YEAR = 2013
const YEARS_OF_EXPERIENCE = new Date().getFullYear() - FOUNDED_YEAR

const STATS = [
  {
    emoji: '✈️',
    value: '10k+',
    label: 'Trips Planned',
    card: 'bg-[#C9F2D3]',
    anim: 'lb-drop-1',
  },
  {
    emoji: '🏆',
    value: `${YEARS_OF_EXPERIENCE}+`,
    label: 'Years of Experience — Since 2013',
    card: 'bg-[#FBF3C9]',
    anim: 'lb-drop-2',
  },
  {
    emoji: '🌍',
    value: '50+',
    label: 'Destinations',
    card: 'bg-[#FBD9DE]',
    anim: 'lb-drop-3',
  },
]

// Responsive positions keep the SAME relative composition as desktop,
// just proportionally scaled for mobile viewports so nothing is clipped.
const POSITIONS = [
  // 10k+ — left side
  'left-[calc(50%-112px)] sm:left-[calc(50%-160px)] lg:left-[calc(50%-216px)] bottom-6 sm:bottom-7 lg:bottom-8',
  // 13+ — right-top
  'left-[calc(50%+6px)] sm:left-[calc(50%+12px)] lg:left-[calc(50%+14px)] bottom-[58px] sm:bottom-14 lg:bottom-16',
  // 50+ — center
  'left-[calc(50%-52px)] sm:left-[calc(50%-72px)] lg:left-[calc(50%-96px)] bottom-0 sm:bottom-0.5 lg:bottom-1',
]

export function LovedByTravellers() {
  const sectionRef = React.useRef(null)
  const [inView, setInView] = React.useState(false)

  React.useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return undefined
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      aria-label="Loved by travellers across India"
      className="overflow-x-hidden bg-background py-8 sm:py-10 lg:py-16"
    >
      <Container>
        <h2 className="text-center text-[22px] font-bold tracking-tight text-gray-900 sm:text-2xl lg:text-3xl">
          Loved by Travellers Across India
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-relaxed text-slate-600 sm:text-[14px]">
          Thousands of real travel moments shared by a community that chooses and trusts us.
        </p>
      </Container>

      {/* Single shared seesaw animation — responsively scaled, not replaced.
          Mobile and desktop use the SAME component/animation, only dimensions
          and absolute offsets scale via responsive classes so the full
          composition stays visible without clipping or huge blank. */}
      <div className="mx-auto mt-6 h-[240px] overflow-visible px-2 sm:mt-2 sm:h-[220px] sm:px-0 lg:h-[310px]">
        <div className="lb-anim mx-auto h-full w-full max-w-[360px] sm:max-w-[620px] lg:max-w-[760px]">
          <div className={['relative mx-auto h-full', inView ? 'lb-play' : ''].join(' ')}>
            {/* Tilt group — plank + everything resting on it. */}
            <div className="lb-plank-group absolute inset-x-0 bottom-8 origin-bottom sm:bottom-8">
              {/* Plank */}
              <div className="absolute bottom-0 left-1/2 h-2 w-[92%] -translate-x-1/2 rounded-full bg-gray-200 sm:h-2.5 sm:w-[min(680px,92%)]" />

              {/* Stat cards — same 3, same anim, responsive size/position */}
              {STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  className={[
                    'absolute flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center shadow-sm sm:gap-1.5 sm:px-3 sm:py-5',
                    'w-[105px] sm:w-[120px] lg:w-[140px]',
                    stat.card,
                    stat.anim,
                    POSITIONS[i],
                  ].join(' ')}
                >
                  <span aria-hidden="true" className="text-[22px] leading-none sm:text-[26px] lg:text-3xl">
                    {stat.emoji}
                  </span>
                  <span className="text-[17px] font-extrabold leading-none text-gray-900 sm:text-xl lg:text-2xl">
                    {stat.value}
                  </span>
                  <span className="text-[11px] font-medium leading-tight text-gray-700 sm:text-xs lg:text-sm">
                    {stat.label}
                  </span>
                </div>
              ))}

              {/* Logo badge — same asset, responsive offset/size */}
              <div className="lb-drop-badge absolute bottom-0 grid place-items-center rounded-2xl bg-white p-1 shadow-md left-[calc(50%+88px)] h-11 w-[84px] sm:left-[calc(50%+150px)] sm:h-14 sm:w-24 lg:left-[calc(50%+220px)] lg:h-16 lg:w-28 sm:p-1.5 lg:p-1.5">
                <img src={BRAND_LOGO_FALLBACK} alt={BRAND_NAME} className="h-full w-full object-contain" />
              </div>
            </div>

            {/* Fulcrum */}
            <div className="absolute bottom-0 left-1/2 h-8 w-20 -translate-x-1/2 rounded-t-full bg-gray-100 sm:h-10 sm:w-24 lg:h-12 lg:w-28" />
          </div>
        </div>
      </div>
    </section>
  )
}
