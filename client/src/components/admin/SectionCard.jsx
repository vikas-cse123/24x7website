import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function SectionCard({ title, description, defaultOpen = true, collapsible = false, children, className, headerActions }) {
  const [open, setOpen] = React.useState(defaultOpen)

  const isCollapsible = collapsible

  return (
    <Card className={cn('rounded-xl border-slate-200 bg-white shadow-sm', className)}>
      <CardHeader
        className={cn('flex flex-row items-start justify-between gap-3 space-y-0 p-4 pb-3', isCollapsible && 'cursor-pointer select-none')}
        onClick={() => isCollapsible && setOpen((v) => !v)}
      >
        <div className="min-w-0 flex-1">
          <CardTitle className="text-sm font-semibold tracking-tight">{title}</CardTitle>
          {description && <CardDescription className="mt-1 text-xs leading-relaxed line-clamp-2">{description}</CardDescription>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {headerActions}
          {isCollapsible && (
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
          )}
        </div>
      </CardHeader>
      {(open || !isCollapsible) && (
        <CardContent className="p-4 pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  )
}
