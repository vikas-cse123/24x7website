import { Container } from '@/components/ui/container'
import { CONFIDENCE_BENEFITS } from '@/lib/homeContent'
import { FaShieldAlt, FaRegCreditCard, FaBan, FaSyncAlt, FaHeadset } from 'react-icons/fa'

// "Book with Confidence" — full-width pale cream strip exactly matching the
// reference: centered heading, 5 icon+text items in 3+2 layout (second row
// centered), colorful icon on the LEFT inside a soft white circular badge
// for premium feel, bold text on the RIGHT, "T&C applied*" at bottom-right.
// Responsive: stacked on mobile, 3+2 on desktop.
const ICONS = [
  { Icon: FaShieldAlt, cls: 'text-emerald-600', bg: 'bg-emerald-50' },
  { Icon: FaRegCreditCard, cls: 'text-blue-600', bg: 'bg-blue-50' },
  { Icon: FaBan, cls: 'text-red-500', bg: 'bg-red-50' },
  { Icon: FaSyncAlt, cls: 'text-amber-600', bg: 'bg-amber-50' },
  { Icon: FaHeadset, cls: 'text-violet-600', bg: 'bg-violet-50' },
]

export function BookWithConfidence() {
  const firstRow = CONFIDENCE_BENEFITS.slice(0, 3)
  const secondRow = CONFIDENCE_BENEFITS.slice(3)

  return (
    <section className="w-full bg-[#FFFCE1]">
      <Container className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-10">
        <h2 className="text-center text-[22px] font-bold tracking-tight text-gray-900 sm:text-2xl lg:text-[26px]">
          Book with Confidence
        </h2>

        <div className="mx-auto mt-8 max-w-5xl">
          {/* First row: 3 items evenly distributed */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4 lg:gap-8">
            {firstRow.map((benefit, idx) => {
              const { Icon, cls, bg } = ICONS[idx]
              return (
                <div key={benefit.title} className="flex items-center gap-3 sm:gap-3.5">
                  <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bg} shadow-sm sm:h-11 sm:w-11`}>
                    <Icon aria-hidden="true" className={`h-5 w-5 sm:h-6 sm:w-6 ${cls}`} />
                  </span>
                  <p className="flex-1 text-sm font-semibold leading-snug text-gray-900 sm:text-[14px] lg:text-[15px]">
                    {benefit.title}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Second row: 2 items centered */}
          <div className="mt-6 grid grid-cols-1 gap-6 sm:mx-auto sm:max-w-[720px] sm:grid-cols-2 sm:gap-4 lg:mt-7 lg:gap-8">
            {secondRow.map((benefit, idx) => {
              const { Icon, cls, bg } = ICONS[idx + 3]
              return (
                <div key={benefit.title} className="flex items-center gap-3 sm:gap-3.5 sm:justify-center">
                  <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bg} shadow-sm sm:h-11 sm:w-11`}>
                    <Icon aria-hidden="true" className={`h-5 w-5 sm:h-6 sm:w-6 ${cls}`} />
                  </span>
                  <p className="flex-1 text-sm font-semibold leading-snug text-gray-900 sm:max-w-[200px] sm:text-[14px] lg:text-[15px]">
                    {benefit.title}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <p className="mt-8 text-right text-[11px] leading-none text-gray-500 sm:text-xs">T&C applied*</p>
      </Container>
    </section>
  )
}
