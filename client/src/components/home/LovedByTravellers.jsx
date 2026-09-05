import * as React from 'react'
import { Container } from '@/components/ui/container'
import { BRAND_LOGO_FALLBACK, BRAND_NAME } from '@/lib/branding'

// "Loved by Travellers Across India" — animated balance-scale strip
// (reference: captureatrip's seesaw loop). Stat cards drop one-by-one onto a
// tilting plank (✈️ → 🏆 → 🌍), then the 24x7 badge drops on the right end
// tipping it the other way; the scene resets and loops while visible.
//
// - Animation runs only while the section is in the viewport
//   (IntersectionObserver) and only when `prefers-reduced-motion` is off
//   (CSS media query; the static resting composition is the default state).
// - Experience years are derived from FOUNDED_YEAR — never hardcoded.
const FOUNDED_YEAR = 2013
const YEARS_OF_EXPERIENCE = new Date().getFullYear() - FOUNDED_YEAR

const STATS = [
  {
    emoji: '✈️',
    value: '10k+',
    label: 'Trips Planned',
    card: 'bg-[#C9F2D3]',
    anim: 'lb-drop-1',
    position: 'left-[calc(50%-216px)] bottom-8',
  },
  {
    emoji: '🏆',
    value: `${YEARS_OF_EXPERIENCE}+`,
    label: 'Years of Experience — Since 2013',
    card: 'bg-[#FBF3C9]',
    anim: 'lb-drop-2',
    position: 'left-[calc(50%+14px)] bottom-16',
  },
  {
    emoji: '🌍',
    value: '50+',
    label: 'Destinations',
    card: 'bg-[#FBD9DE]',
    anim: 'lb-drop-3',
    position: 'left-[calc(50%-96px)] bottom-1',
  },
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
      className="overflow-hidden bg-background py-12 lg:py-16"
    >
      <Container>
        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Loved by Travellers Across India
        </h2>
      </Container>

      {/* Balance-scale stage. Static default = final resting composition;
          `.lb-play` (in viewport) starts the drop/tilt/loop keyframes.
          The stage scales down on small screens (no layout reflow needed). */}
      <div className="mx-auto mt-2 h-[200px] overflow-visible sm:h-[260px] lg:h-[310px]">
        <div className="lb-anim mx-auto h-[310px] w-[min(760px,100%)] origin-bottom scale-[0.5] sm:scale-[0.8] lg:scale-100">
          <div
            className={[
              'relative mx-auto h-full',
              inView ? 'lb-play' : '',
            ].join(' ')}
          >
            {/* Tilt group — plank + everything resting on it. */}
            <div className="lb-plank-group absolute inset-x-0 bottom-8 origin-bottom">
              {/* Plank */}
              <div className="absolute bottom-0 left-1/2 h-2.5 w-[min(680px,92%)] -translate-x-1/2 rounded-full bg-gray-200" />

              {/* Stat cards */}
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className={[
                    'absolute flex w-[140px] flex-col items-center gap-1.5 rounded-2xl px-3 py-5 text-center shadow-sm',
                    stat.card,
                    stat.anim,
                    stat.position,
                  ].join(' ')}
                >
                  <span aria-hidden="true" className="text-3xl leading-none">
                    {stat.emoji}
                  </span>
                  <span className="text-2xl font-extrabold leading-none text-gray-900">
                    {stat.value}
                  </span>
                  <span className="text-sm font-medium leading-tight text-gray-700">
                    {stat.label}
                  </span>
                </div>
              ))}

              {/* Real company logo (never changes) — drops last on the right
                  end as the counterweight that balances the plank. */}
              <div className="lb-drop-badge absolute bottom-1 left-[calc(50%+220px)] grid h-16 w-28 place-items-center rounded-2xl bg-white p-1.5 shadow-md">
                <img
                  src={BRAND_LOGO_FALLBACK}
                  alt={BRAND_NAME}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* Fulcrum */}
            <div className="absolute bottom-0 left-1/2 h-12 w-28 -translate-x-1/2 rounded-t-full bg-gray-100" />
          </div>
        </div>
      </div>
    </section>
  )
}
