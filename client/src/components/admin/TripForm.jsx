import * as React from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { tripSchema, TRIP_TYPES, TRIP_TYPE_LABELS, tripFormDefault } from '@/schemas/trip'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { ListItemEditor } from '@/components/trips/ListItemEditor'
import { FaqListEditor } from '@/components/trips/FaqListEditor'
import { TripItineraryBuilder } from '@/components/trips/TripItineraryBuilder'

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

function FormSection({ title, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function Field({ label, error, children, hint }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <FieldError message={error} />
    </div>
  )
}

export function TripForm({ initialValues, destinations, tripCode, isSubmitting, submitLabel, onSubmit }) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(tripSchema),
    defaultValues: initialValues || tripFormDefault,
  })

  const gallery = useFieldArray({ control, name: 'gallery' })
  const featured = watch('featured')
  const published = watch('published')

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FormSection title="Basic Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Destination" error={errors.destinationId?.message}>
            <Select {...register('destinationId')} defaultValue="">
              <option value="">Select a destination</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.country ? ` — ${d.country}` : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Trip type" error={errors.tripType?.message}>
            <Select {...register('tripType')}>
              {TRIP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TRIP_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Trip name" error={errors.name?.message}>
            <Input placeholder="e.g. Vietnam 8 Days" aria-invalid={!!errors.name} {...register('name')} />
          </Field>
          <Field
            label="Slug"
            error={errors.slug?.message}
            hint="URL-safe. Auto-generated from the name if left blank."
          >
            <Input placeholder="vietnam-8-days" aria-invalid={!!errors.slug} {...register('slug')} />
          </Field>
          {tripCode && (
            <Field label="Trip code" hint="Generated server-side and not editable.">
              <Input value={tripCode} readOnly disabled />
            </Field>
          )}
        </div>
        <div className="mt-4 space-y-4">
          <Field label="Short description" error={errors.shortDescription?.message}>
            <Textarea rows={2} maxLength={300} placeholder="A short summary shown on cards" {...register('shortDescription')} />
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <Textarea rows={5} placeholder="Full description of the trip" {...register('description')} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Duration">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Days" error={errors.durationDays?.message}>
            <Input type="number" min={1} placeholder="8" {...register('durationDays')} />
          </Field>
          <Field label="Nights" error={errors.durationNights?.message}>
            <Input type="number" min={0} placeholder="7" {...register('durationNights')} />
          </Field>
          <Field label="Maximum group size" error={errors.maxGroupSize?.message}>
            <Input type="number" min={1} placeholder="20" {...register('maxGroupSize')} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Pricing">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starting price" error={errors.startingPrice?.message} hint="Base package price only. Departure-specific pricing comes later.">
            <Input type="number" min={0} placeholder="51999" {...register('startingPrice')} />
          </Field>
          <Field label="Currency" error={errors.currency?.message}>
            <Input placeholder="INR" {...register('currency')} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Media">
        <div className="space-y-6">
          <div>
            <Label>Hero image</Label>
            <div className="mt-1.5">
              <ImageUploader value={watch('heroImage')} onChange={(v)=> setValue('heroImage', {...(watch('heroImage')||{}), ...v, alt: v.alt || watch('heroImage.alt')}, {shouldValidate:true, shouldDirty:true})} folder="trip-media" />
            </div>
            <div className="mt-2"><Input placeholder="Alt text" {...register('heroImage.alt')} /></div>
          </div>
          <div>
            <Label>Gallery</Label>
            <div className="mt-1.5">
              <ImageUploader value={watch('gallery')||[]} onChange={(v)=> setValue('gallery', v, {shouldValidate:true, shouldDirty:true})} multiple folder="trip-media" />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Itinerary">
        <TripItineraryBuilder control={control} register={register} errors={errors} />
      </FormSection>

      <FormSection title="Inclusions">
        <ListItemEditor control={control} name="inclusions" label="Inclusions" placeholder="e.g. Airport transfers" />
      </FormSection>

      <FormSection title="Exclusions">
        <ListItemEditor control={control} name="exclusions" label="Exclusions" placeholder="e.g. International flights" />
      </FormSection>

      <FormSection title="Important information">
        <Field label="Travel information" error={errors.importantInformation?.message} hint="Visa, passport, cancellation, fitness, luggage, weather…">
          <Textarea rows={4} placeholder="Important details travellers should know" {...register('importantInformation')} />
        </Field>
      </FormSection>

      <FormSection title="FAQs">
        <FaqListEditor control={control} />
      </FormSection>

      <FormSection title="Discovery">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox checked={featured} onCheckedChange={(v) => setValue('featured', v, { shouldValidate: true })} />
            <span>
              Featured
              <span className="ml-1 text-xs text-muted-foreground">(highlight on listings)</span>
            </span>
          </label>
          <div className="w-full sm:max-w-[200px]">
            <Field label="Display order" error={errors.displayOrder?.message}>
              <Input type="number" min={0} {...register('displayOrder')} />
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection title="SEO">
        <div className="space-y-4">
          <Field label="SEO title" error={errors.seoTitle?.message}>
            <Input placeholder="Vietnam 8 Days Tour Package" {...register('seoTitle')} />
          </Field>
          <Field label="SEO description" error={errors.seoDescription?.message}>
            <Textarea rows={2} {...register('seoDescription')} />
          </Field>
          <Field label="SEO keywords" error={errors.seoKeywords?.message}>
            <Input placeholder="vietnam, hanoi, ho chi minh" {...register('seoKeywords')} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Publishing">
        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox checked={published} onCheckedChange={(v) => setValue('published', v, { shouldValidate: true })} />
          <span>
            Published
            <span className="ml-1 text-xs text-muted-foreground">(visible on the public site)</span>
          </span>
        </label>
      </FormSection>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}