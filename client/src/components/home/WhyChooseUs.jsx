import { Container } from '@/components/ui/container'
import { WHY_CHOOSE_US } from '@/lib/homeContent'

// "Reasons To Make Us Your Travel Bestie" — full-width sage strip with wavy
// top/bottom edges (white sawtooth SVG), white rounded cards laid out 3 + 2
// (second row centered). Playful emoji icon + title + description per card.
// Configurable via WHY_CHOOSE_US.

const SAGE = '#B5D6D4'

// Sawtooth wave path across the given width, oscillating around `mid`.
function wavePath(width = 1440, mid = 8, amp = 4, period = 48) {
  let d = `M0 0 L0 ${mid} `
  for (let x = 0; x < width; x += period) {
    d += `Q ${x + period * 0.25} ${mid - amp} ${x + period / 2} ${mid} `
    d += `Q ${x + period * 0.75} ${mid + amp} ${x + period} ${mid} `
  }
  d += `L${width} 0 Z`
  return d
}

export function WhyChooseUs() {
  return (
    <section style={{ backgroundColor: SAGE }}>
      {/* Wavy top edge: white page background bites into the sage strip. */}
      <svg
        viewBox="0 0 1440 16"
        preserveAspectRatio="none"
        className="block h-4 w-full"
        aria-hidden="true"
      >
        <path d={wavePath()} fill="#ffffff" />
      </svg>

      <Container className="py-8 lg:py-10">
        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Reasons To Make Us Your Travel Bestie
        </h2>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {WHY_CHOOSE_US.map((usp) => (
            <div
              key={usp.title}
              className="flex w-full items-start gap-4 rounded-xl bg-card p-5 shadow-card sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-1rem)]"
            >
              <span aria-hidden="true" className="shrink-0 text-[30px] leading-none">
                {usp.emoji}
              </span>
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">{usp.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{usp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Wavy bottom edge (same wave, rotated). */}
      <svg
        viewBox="0 0 1440 16"
        preserveAspectRatio="none"
        className="block h-4 w-full rotate-180"
        aria-hidden="true"
      >
        <path d={wavePath()} fill="#ffffff" />
      </svg>
    </section>
  )
}
