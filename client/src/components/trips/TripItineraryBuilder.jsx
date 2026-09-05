import * as React from 'react'
import { useFieldArray } from 'react-hook-form'
import { Plus, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TripItineraryDay } from '@/components/trips/TripItineraryDay'

// Day-by-day itinerary builder. Add / remove / reorder days.
export function TripItineraryBuilder({ control, register, watch, setValue, errors }) {
  const { fields, append, remove, swap } = useFieldArray({ control, name: 'itinerary' })

  function addDay() {
    append({
      dayNumber: fields.length + 1,
      title: '',
      description: '',
      activities: [],
      meals: [],
      accommodation: '',
      notes: '',
    })
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Itinerary</h3>
      </div>

      {fields.length === 0 ? (
        <p className="mb-3 rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          No itinerary days yet. Add the first day below.
        </p>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <TripItineraryDay
              key={field.id}
              control={control}
              register={register}
              watch={watch}
              setValue={setValue}
              index={index}
              total={fields.length}
              errors={errors?.itinerary?.[index]}
              onUp={() => swap(index, index - 1)}
              onDown={() => swap(index, index + 1)}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" className="mt-4" onClick={addDay}>
        <Plus className="h-4 w-4" />
        Add day
      </Button>
    </div>
  )
}