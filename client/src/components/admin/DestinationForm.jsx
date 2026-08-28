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
import { destinationSchema, DESTINATION_TYPES, DESTINATION_CATEGORIES, destinationFormDefault } from '@/schemas/destination'
import { ImageUploader } from '@/components/ui/ImageUploader'

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

export function DestinationForm({ initialValues, isSubmitting, submitLabel, onSubmit }) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(destinationSchema),
    defaultValues: initialValues || destinationFormDefault,
  })

  const gallery = useFieldArray({ control, name: 'gallery' })
  const featured = watch('featured')
  const published = watch('published')

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FormSection title="Basic Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" error={errors.name?.message}>
            <Input placeholder="e.g. Vietnam" aria-invalid={!!errors.name} {...register('name')} />
          </Field>
          <Field
            label="Slug"
            error={errors.slug?.message}
            hint="URL-safe. Auto-generated from the name if left blank."
          >
            <Input placeholder="vietnam" aria-invalid={!!errors.slug} {...register('slug')} />
          </Field>
          <Field label="Country" error={errors.country?.message}>
            <Input placeholder="e.g. Vietnam" aria-invalid={!!errors.country} {...register('country')} />
          </Field>
          <Field label="Region" error={errors.region?.message}>
            <Input placeholder="e.g. Southeast Asia" {...register('region')} />
          </Field>
          <Field label="Type / Category" error={errors.type?.message}>
            <Select {...register('type')}>
              {DESTINATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Market category" error={errors.category?.message} hint="Used by homepage destination tabs.">
            <Select {...register('category')}>
              {DESTINATION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Content">
        <div className="space-y-4">
          <Field label="Short Description" error={errors.shortDescription?.message}>
            <Textarea
              rows={2}
              maxLength={300}
              placeholder="A short summary shown on cards"
              {...register('shortDescription')}
            />
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <Textarea
              rows={6}
              placeholder="Full description of the destination"
              {...register('description')}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Media">
        <div className="space-y-6">
          <div>
            <Label>Hero image</Label>
            <div className="mt-1.5">
              <ImageUploader value={watch('heroImage')} onChange={(v)=> setValue('heroImage', {...(watch('heroImage')||{}), ...v, alt: v.alt || watch('heroImage.alt')}, {shouldValidate:true, shouldDirty:true})} folder="destination-media" />
            </div>
            <div className="mt-2">
              <Input placeholder="Alt text for hero image" {...register('heroImage.alt')} />
            </div>
            {errors.heroImage && <FieldError message={errors.heroImage.message || errors.heroImage?.url?.message} />}
          </div>
          <div>
            <Label>Gallery</Label>
            <div className="mt-1.5">
              <ImageUploader value={watch('gallery')||[]} onChange={(v)=> setValue('gallery', v, {shouldValidate:true, shouldDirty:true})} multiple folder="destination-media" />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Commercial">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starting price" error={errors.startingPrice?.message}>
            <Input
              type="number"
              min={0}
              placeholder="51999"
              {...register('startingPrice')}
            />
          </Field>
          <Field label="Currency" error={errors.currency?.message}>
            <Input placeholder="INR" {...register('currency')} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Discovery">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox
              checked={featured}
              onCheckedChange={(v) => setValue('featured', v, { shouldValidate: true })}
            />
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
            <Input placeholder="Vietnam Tour Packages" {...register('seoTitle')} />
          </Field>
          <Field label="SEO description" error={errors.seoDescription?.message}>
            <Textarea rows={2} {...register('seoDescription')} />
          </Field>
          <Field label="SEO keywords" error={errors.seoKeywords?.message}>
            <Input placeholder="vietnam, vietnam tours" {...register('seoKeywords')} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Status">
        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox
            checked={published}
            onCheckedChange={(v) => setValue('published', v, { shouldValidate: true })}
          />
          <span>
            Published
            <span className="ml-1 text-xs text-muted-foreground">
              (visible on the public site)
            </span>
          </span>
        </label>
      </FormSection>

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}