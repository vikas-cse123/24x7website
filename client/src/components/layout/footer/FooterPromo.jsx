import { Plane } from 'lucide-react'

const PATH_COLOR = 'hsl(142 76% 36%)'
const HEADLINE_COLOR = '#1b4332'
const BANNER_BG = '#FFFDE5'

// Centered composition: headline + large plane/string as one centered graphic
// Plane points RIGHT like reference, sits ON string start, gap small.
// No huge left gap — entire group centered in cream banner.
function TravelIllustration() {
  return (
    <div
      aria-hidden="true"
      className="relative h-[150px] w-full max-w-[880px] sm:h-[180px] lg:h-[210px] xl:h-[220px] xl:max-w-[960px]"
    >
      <svg
        viewBox="0 0 900 220"
        fill="none"
        className="absolute inset-0 h-full w-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d="M 0 105 C 80 82 160 72 240 96 C 310 120 360 138 420 112 C 470 88 515 42 480 14 C 445 -12 388 14 400 62 C 412 110 462 142 525 124 C 625 98 720 82 900 72"
          stroke={PATH_COLOR}
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <Plane
        className="absolute h-[95px] w-[95px] sm:h-[108px] sm:w-[108px] lg:h-[118px] lg:w-[118px] xl:h-[128px] xl:w-[128px] text-[#14281e]"
        style={{
          left: 0,
          top: '50%',
          transform: 'translate(-38%, -52%) rotate(12deg)',
        }}
        fill="currentColor"
        strokeWidth={1.15}
      />
    </div>
  )
}

export function FooterPromo() {
  return (
    <section
      aria-label="Adventure awaits you"
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: BANNER_BG }}
    >
      <div className="relative flex min-h-[460px] flex-col items-center justify-center px-5 pb-10 pt-10 sm:min-h-[500px] sm:px-6 lg:min-h-[560px] lg:px-[90px] lg:pb-12 lg:pt-12">
        <div className="flex w-full max-w-[1280px] flex-col items-center gap-6 sm:gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-10 xl:gap-12">
          <h2
            className="w-full shrink-0 text-center text-[44px] font-bold italic leading-[0.88] tracking-[-0.02em] sm:text-[62px] lg:w-[500px] lg:text-left lg:text-[96px] xl:w-[520px] xl:text-[106px]"
            style={{ color: HEADLINE_COLOR }}
          >
            Adventure
            <br />
            <span className="whitespace-nowrap">awaits you.</span>
          </h2>
          <div className="flex w-full min-w-0 flex-1 items-center justify-center lg:max-w-[660px] xl:max-w-[760px]">
            <TravelIllustration />
          </div>
        </div>
      </div>
    </section>
  )
}
