import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ListItemEditor } from '@/components/trips/ListItemEditor'
import { cn } from '@/lib/utils'

// One editable itinerary day.
export function TripItineraryDay({ control, register, index, total, errors, onUp, onDown, onRemove }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Day</span>
          <Input
            type="number"
            min={1}
            aria-label={`Day ${index + 1} number`}
            className="h-8 w-20"
            {...register(`itinerary.${index}.dayNumber`)}
          />
          {errors?.dayNumber && <span className="text-xs text-destructive">{errors.dayNumber.message}</span>}
        </div>
        <div className="flex items-center gap-1">
          <IconButton aria-label="Move day up" onClick={onUp} disabled={index === 0}>
            <ArrowUp className="h-4 w-4" />
          </IconButton>
          <IconButton aria-label="Move day down" onClick={onDown} disabled={index === total - 1}>
            <ArrowDown className="h-4 w-4" />
          </IconButton>
          <IconButton aria-label="Remove day" onClick={onRemove} className="hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <Label htmlFor={`itinerary.${index}.title`}>Title</Label>
          <Input
            id={`itinerary.${index}.title`}
            className="mt-1"
            placeholder="e.g. Arrival in Hanoi"
            {...register(`itinerary.${index}.title`)}
          />
        </div>

        <div>
          <Label htmlFor={`itinerary.${index}.description`}>Description</Label>
          <textarea
            id={`itinerary.${index}.description`}
            rows={3}
            className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="What happens on this day"
            {...register(`itinerary.${index}.description`)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ListItemEditor
            control={control}
            name={`itinerary.${index}.activities`}
            label="Activities"
            placeholder="e.g. Airport pickup"
          />
          <ListItemEditor
            control={control}
            name={`itinerary.${index}.meals`}
            label="Meals"
            placeholder="e.g. Dinner"
          />
        </div>

        <div>
          <Label htmlFor={`itinerary.${index}.accommodation`}>Accommodation</Label>
          <Input
            id={`itinerary.${index}.accommodation`}
            className="mt-1"
            placeholder="e.g. Hanoi hotel"
            {...register(`itinerary.${index}.accommodation`)}
          />
        </div>

        <div>
          <Label htmlFor={`itinerary.${index}.notes`}>Notes</Label>
          <textarea
            id={`itinerary.${index}.notes`}
            rows={2}
            className="mt-1 flex min-h-[48px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Optional notes"
            {...register(`itinerary.${index}.notes`)}
          />
        </div>
      </div>
    </div>
  )
}

function IconButton({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}