import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

const faqFormSchema = z.object({
  question: z.string().trim().min(5, 'Question must be at least 5 characters').max(300),
  answer: z.string().trim().min(10, 'Answer must be at least 10 characters').max(2000),
  category: z.string().trim().max(60).optional(),
  scope: z.enum(['global', 'destination', 'trip']),
  destinationId: z.string().optional(),
  tripId: z.string().optional(),
  displayOrder: z.coerce.number().int().min(0),
  published: z.boolean(),
})

export function FaqForm({ initialValues, destinations = [], trips = [], isSubmitting, submitLabel, onSubmit }) {
  const defaults = React.useMemo(() => {
    const base = initialValues || {}
    let scope = 'global'
    if (base.tripId) scope = 'trip'
    else if (base.destinationId) scope = 'destination'
    return {
      question: base.question || '',
      answer: base.answer || '',
      category: base.category || 'general',
      scope,
      destinationId: base.destinationId || '',
      tripId: base.tripId || '',
      displayOrder: base.displayOrder ?? 0,
      published: !!base.published,
    }
  }, [initialValues])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(faqFormSchema),
    defaultValues: defaults,
  })

  const scope = watch('scope')

  function submit(values) {
    onSubmit({
      question: values.question.trim(),
      answer: values.answer.trim(),
      category: values.category?.trim() || 'general',
      destinationId: values.scope === 'destination' && values.destinationId ? values.destinationId : null,
      tripId: values.scope === 'trip' && values.tripId ? values.tripId : null,
      displayOrder: Number(values.displayOrder) || 0,
      published: values.published,
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">FAQ details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="faq-question">Question *</Label>
            <Input id="faq-question" className="mt-1.5" aria-invalid={!!errors.question} {...register('question')} />
            {errors.question && <p className="mt-1 text-xs text-destructive">{errors.question.message}</p>}
          </div>
          <div>
            <Label htmlFor="faq-answer">Answer *</Label>
            <div className="mt-1.5">
              <RichTextEditor
                value={watch('answer') || ''}
                onChange={(html) => setValue('answer', html, { shouldValidate: true, shouldDirty: true })}
                placeholder="Answer…"
                error={!!errors.answer}
              />
            </div>
            {errors.answer && <p className="mt-1 text-xs text-destructive">{errors.answer.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="faq-category">Category</Label>
              <Input id="faq-category" className="mt-1.5" placeholder="general" {...register('category')} />
            </div>
            <div>
              <Label htmlFor="faq-order">Display order</Label>
              <Input id="faq-order" type="number" min={0} className="mt-1.5" {...register('displayOrder')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Scope</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="faq-scope">Scope *</Label>
            <Select id="faq-scope" className="mt-1.5" {...register('scope')}>
              <option value="global">Global</option>
              <option value="destination">Destination</option>
              <option value="trip">Trip</option>
            </Select>
          </div>

          {scope === 'destination' && (
            <div>
              <Label htmlFor="faq-dest">Destination *</Label>
              <Select id="faq-dest" className="mt-1.5" {...register('destinationId')}>
                <option value="">Select a destination</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} — {d.country}</option>
                ))}
              </Select>
              {errors.destinationId && <p className="mt-1 text-xs text-destructive">{errors.destinationId.message}</p>}
            </div>
          )}

          {scope === 'trip' && (
            <div>
              <Label htmlFor="faq-trip">Trip *</Label>
              <Select id="faq-trip" className="mt-1.5" {...register('tripId')}>
                <option value="">Select a trip</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Publishing</CardTitle></CardHeader>
        <CardContent>
          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox checked={watch('published')} onCheckedChange={(v) => setValue('published', v, { shouldValidate: true })} />
            Published
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
