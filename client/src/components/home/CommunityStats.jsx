import { Container } from '@/components/ui/container'
import { Award, Plane, Globe2 } from 'lucide-react'

// Premium travel strip — thin outline icons, distinct jewel tones, 55-65px tall,
// subtle tint, no emoji/circle bg, identical 20px stroke.
const STATS = [
  {
    Icon: Award,
    title: '13+ Years of Experience — Since 2013',
    color: 'text-[#9A6B2E]', // warm brass/gold – premium, not cheap yellow
  },
  {
    Icon: Plane,
    title: '10k+ Trips Planned',
    color: 'text-[#1E6FA3]', // deep sky – premium travel blue
  },
  {
    Icon: Globe2,
    title: '50+ Destinations',
    color: 'text-[#0F766E]', // deep teal – premium, not flat green
  },
]

export function CommunityStats() {
  return (
    <section className="border-y border-emerald-100/60 bg-[#F1F8F5]">
      <Container className="py-4">
        <div className="grid grid-cols-1 divide-y divide-emerald-100/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {STATS.map(({ Icon, title, color }) => (
            <div key={title} className="flex items-center justify-center gap-2">
              <Icon className={`h-5 w-5 shrink-0 ${color}`} aria-hidden="true" strokeWidth={1.7} />
              <p className="whitespace-nowrap text-[14px] font-semibold leading-none tracking-tight text-[#0F172A] sm:text-[14.5px]">
                {title}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}