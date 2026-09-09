import * as React from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { TRIP_TYPE_LABELS } from '@/schemas/trip'

// Active filter shape (all optional):
// { tripType, category, destination, minPrice, maxPrice,
//   departureDate, departureFrom, departureTo, featured }
// `destinations` are real Destination records for the selector.
// `idPrefix` keeps label/htmlFor pairs unique when this panel is rendered
// twice (desktop sidebar + mobile drawer).

const BUDGET_PRESETS = [
  { label: 'Under ₹25k', min: null, max: 25000 },
  { label: '₹25k–50k', min: 25000, max: 50000 },
  { label: '₹50k–75k', min: 50000, max: 75000 },
  { label: '₹75k+', min: 75000, max: null },
]

// Trip Type options shown on the public Trips page. Deliberately narrower
// than TRIP_TYPES (which must keep every value for validation, stored trips
// and the admin form): Customized, Honeymoon, Family, Adventure and Weekend
// are hidden here, as is the internal match_maker value.
const VISIBLE_TRIP_TYPES = [
  'group',
  'international',
  'domestic',
  'bike',
  'spiritual',
  'wellness',
  'trek',
  'northern_lights_early_bird',
  'middle_age_trips',
  'upcoming_group_trips',
  'corporate',
]

function Group({ title, children }) {
  return (
    <div className="border-b border-border pb-5 last:border-0 last:pb-0">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      {children}
    </div>
  )
}

export function TripFilterPanel({
  idPrefix,
  filters,
  destinations = [],
  onChange,
  onClear,
}) {
  const set = (patch) => onChange?.(patch)
  const activeBudgetPreset =
    BUDGET_PRESETS.find(
      (p) =>
        String(p.min ?? '') === String(filters.minPrice ?? '') &&
        String(p.max ?? '') === String(filters.maxPrice ?? '')
    )?.label || null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-base font-bold">
          <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden="true" />
          Filters
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onClear} className="text-primary hover:text-primary">
          Clear all
        </Button>
      </div>

      <Group title="Trip Type">
        <div className="flex flex-wrap gap-2">
          {VISIBLE_TRIP_TYPES.map((t) => {
            const active = filters.tripType === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => set({ tripType: active ? null : t })}
                aria-pressed={active}
                className={`max-w-full break-words rounded-full px-3 py-1.5 text-xs font-medium leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {TRIP_TYPE_LABELS[t]}
              </button>
            )
          })}
        </div>
      </Group>

      <Group title="Domestic / International">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Domestic or international trips">
          {[
            { value: null, label: 'All' },
            { value: 'domestic', label: 'Domestic' },
            { value: 'international', label: 'International' },
          ].map((opt) => {
            const active = (filters.category || null) === opt.value
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => set({ category: opt.value })}
                aria-pressed={active}
                className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </Group>

      <Group title="Destinations">
        <Label htmlFor={`${idPrefix}-destination`} className="sr-only">
          Destination
        </Label>
        <Select
          id={`${idPrefix}-destination`}
          value={filters.destination || ''}
          onChange={(e) => set({ destination: e.target.value || null })}
        >
          <option value="">All destinations</option>
          {destinations.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </Select>
      </Group>

      <Group title="Budget (per person)">
        <div className="flex flex-wrap gap-2">
          {BUDGET_PRESETS.map((p) => {
            const active = activeBudgetPreset === p.label
            return (
              <button
                key={p.label}
                type="button"
                onClick={() =>
                  set(
                    active
                      ? { minPrice: null, maxPrice: null }
                      : { minPrice: p.min, maxPrice: p.max }
                  )
                }
                aria-pressed={active}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </Group>
    </div>
  )
}
