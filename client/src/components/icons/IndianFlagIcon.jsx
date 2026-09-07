import { cn } from '@/lib/utils'

// Indian flag mark served from the project's own public assets.
// Decorative: the adjacent label carries the meaning, so it is hidden from
// assistive tech. Default size matches the surrounding emoji icons (~15px);
// pass className to enlarge it (e.g. h-4 w-4 where it needs the same perceived
// visual weight as full-bleed emoji). object-contain preserves the artwork's
// aspect ratio — never stretched.
export function IndianFlagIcon({ className }) {
  return (
    <img
      src="/icons/IndianFlag.svg"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn('h-[15px] w-[15px] object-contain', className)}
    />
  )
}
