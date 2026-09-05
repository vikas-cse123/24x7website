import { Plane } from 'lucide-react'

const PATH_COLOR = 'hsl(142 76% 36%)'
const HEADLINE_COLOR = '#1b4332'

// Minimal flat vector illustration: a smooth green travel path with one loop
// flowing behind a right-pointing airplane. Pure SVG + the lucide Plane glyph
// so it stays crisp at every size.
function TravelIllustration() {
  return (
    <div
      aria-hidden="true"
      className="w-full max-w-sm text-primary lg:max-w-md"
    >
      <div className="relative">
        <svg viewBox="0 0 520 200" fill="none" className="h-auto w-full">
          <path
            d="M8 128 C 90 40 190 30 250 78 C 300 118 272 168 230 158 C 192 149 202 104 254 96 C 332 84 398 108 456 88"
            stroke={PATH_COLOR}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
        <Plane
          className="absolute h-10 w-10 sm:h-12 sm:w-12"
          style={{
            left: '88%',
            top: '44%',
            transform: 'translate(-50%, -50%) rotate(40deg)',
          }}
          fill="currentColor"
          strokeWidth={1.5}
        />
      </div>
    </div>
  )
}

export function FooterPromo() {
  return (
    <section aria-label="Adventure awaits you">
      <div className="grid items-center gap-10 py-14 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-6 lg:py-24">
        <h2
          className="text-5xl font-medium italic leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
          style={{ color: HEADLINE_COLOR }}
        >
          Adventure
          <br />
          awaits you.
        </h2>
        <div className="flex justify-center lg:justify-end">
          <TravelIllustration />
        </div>
      </div>
    </section>
  )
}
