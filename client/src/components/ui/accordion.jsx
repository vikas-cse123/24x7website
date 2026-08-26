import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Lightweight accessible accordion (single-open). Each item toggles its content;
// the whole accordion is keyboard navigable via the toggle buttons.
export function Accordion({ items, className }) {
  const [openIndex, setOpenIndex] = React.useState(0)

  return (
    <div className={cn('divide-y divide-border rounded-xl border border-border bg-card', className)}>
      {items.map((item, index) => {
        const open = openIndex === index
        return (
          <div key={index}>
            <h3>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? -1 : index)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-medium transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.question}
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
              </button>
            </h3>
            {open && (
              <p className="px-5 pb-4 text-sm text-muted-foreground">{item.answer}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}