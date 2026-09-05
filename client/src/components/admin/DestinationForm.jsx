import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { destinationSchema, DESTINATION_TYPES, DESTINATION_CATEGORIES, destinationFormDefault } from '@/schemas/destination'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

function RecordSection({ title, children }) {
  return (
    <div className="border-b border-slate-200 py-4 first:pt-0 last:border-b-0 last:pb-0">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function DenseField({ label, required, error, children, hint }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-600">*</span>}
      </Label>
      <div className="mt-1">{children}</div>
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      <FieldError message={error} />
    </div>
  )
}

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'content', label: 'Content' },
  { id: 'media', label: 'Media' },
  { id: 'publishing', label: 'Publishing' },
  { id: 'seo', label: 'SEO' },
]

export function DestinationForm({ initialValues, isSubmitting, submitLabel, onSubmit, onDelete }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(destinationSchema),
    defaultValues: initialValues || destinationFormDefault,
  })

  const [activeTab, setActiveTab] = React.useState('details')
  const [editorExpanded, setEditorExpanded] = React.useState(false)

  React.useEffect(() => {
    if (initialValues) reset(initialValues)
  }, [initialValues, reset])

  const published = watch('published')
  const featured = watch('featured')

  const sessionUploadKeysRef = React.useRef(new Set())
  const trackUpload = React.useCallback((media) => {
    if (media?.publicId) sessionUploadKeysRef.current.add(media.publicId)
  }, [])

  function handleSubmitWithSessionKeys(values) {
    onSubmit({ ...values, sessionUploadKeys: [...sessionUploadKeysRef.current] })
  }

  const hasDirty = isDirty

  React.useEffect(() => {
    const h = (e) => {
      if (!hasDirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [hasDirty])

  const onInvalid = React.useCallback(() => {
    setTimeout(() => {
      const el = document.querySelector('[aria-invalid="true"]')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }, [])

  return (
    <form onSubmit={handleSubmit(handleSubmitWithSessionKeys, onInvalid)} noValidate className="pb-10">
      {/* Tabs — sticky */}
      <div className="sticky top-12 z-10 mb-4 -mx-3 border-y border-slate-200 bg-white px-3 sm:mx-0 sm:px-0">
        <div className="-mb-px flex gap-5 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`shrink-0 border-b-2 px-1 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
                activeTab === t.id
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-4xl bg-white">
        {activeTab === 'details' && (
          <div className="space-y-0 divide-y divide-slate-200 border border-slate-200 bg-white">
            <div className="p-4">
              <RecordSection title="Basic Information">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DenseField label="Name" required error={errors.name?.message}>
                    <Input placeholder="Sri Lanka Tour Packages" {...register('name')} className="h-8 text-sm" aria-invalid={!!errors.name} />
                  </DenseField>
                  <DenseField label="Slug" error={errors.slug?.message} hint="Auto-generated if blank">
                    <Input placeholder="sri-lanka-tour-packages" {...register('slug')} className="h-8 text-sm" aria-invalid={!!errors.slug} />
                  </DenseField>
                  <DenseField label="Country" required error={errors.country?.message}>
                    <Input placeholder="Sri Lanka" {...register('country')} className="h-8 text-sm" aria-invalid={!!errors.country} />
                  </DenseField>
                  <DenseField label="Region" error={errors.region?.message}>
                    <Input placeholder="Asia" {...register('region')} className="h-8 text-sm" />
                  </DenseField>
                  <DenseField label="Type" error={errors.type?.message}>
                    <Select {...register('type')} className="h-8 text-sm">
                      {DESTINATION_TYPES.map((t) => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}</option>
                      ))}
                    </Select>
                  </DenseField>
                  <DenseField label="Market Category" error={errors.category?.message}>
                    <Select {...register('category')} className="h-8 text-sm">
                      {DESTINATION_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </Select>
                  </DenseField>
                </div>
              </RecordSection>

              <RecordSection title="Commercial">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DenseField label="Starting Price" error={errors.startingPrice?.message}>
                    <Input type="number" min={0} placeholder="51999" {...register('startingPrice')} className="h-8 text-sm" />
                  </DenseField>
                  <DenseField label="Currency" error={errors.currency?.message}>
                    <Input placeholder="INR" {...register('currency')} className="h-8 text-sm" />
                  </DenseField>
                </div>
              </RecordSection>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="border border-slate-200 bg-white p-4">
            <RecordSection title="Content">
              <DenseField label="Description" required error={errors.description?.message}>
                <p className="mb-1 text-xs text-slate-500">Write the complete destination description. This content is shown on the destination page. Visitors see a short preview and can select Read More to view the complete content.</p>
                <RichTextEditor
                  value={watch('description') || ''}
                  onChange={(html) => setValue('description', html, { shouldValidate: true, shouldDirty: true })}
                  placeholder="Write a detailed description..."
                  error={!!errors.description}
                  className={editorExpanded ? 'min-h-[500px]' : 'min-h-[300px]'}
                />
                <div className="mt-2 flex justify-end">
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditorExpanded((v) => !v)}>
                    {editorExpanded ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </DenseField>
            </RecordSection>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-0 divide-y divide-slate-200 border border-slate-200 bg-white p-4">
            <div className="pb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Media</h3>
              <p className="mt-1 text-xs text-slate-500">Manage the images/videos used throughout the website.</p>
            </div>

            <div className="py-4">
              <p className="text-xs font-semibold text-slate-700">Homepage Destination Image</p>
              <p className="mt-1 text-xs text-slate-500">Shown on: Homepage → Explore Destinations</p>
              <p className="text-xs text-slate-500">This is the small image shown above/beside the destination name on the homepage.</p>
              <div className="mt-3">
                <CompactMediaBlock
                  value={watch('homepageImage')}
                  onChange={(v) => setValue('homepageImage', { ...(watch('homepageImage') || {}), ...v, alt: v.alt || watch('homepageImage.alt') }, { shouldValidate: true, shouldDirty: true })}
                  onUploaded={trackUpload}
                  error={errors.homepageImage?.message}
                />
                <div className="mt-2">
                  <Input placeholder="Alt text" {...register('homepageImage.alt')} className="h-8 text-sm" />
                </div>
              </div>
            </div>

            <div className="py-4">
              <p className="text-xs font-semibold text-slate-700">Destination Page Hero</p>
              <p className="mt-1 text-xs text-slate-500">Shown at the top of: /destination/{watch('slug') || 'slug'}</p>
              <div className="mt-3">
                <CompactMediaBlock
                  value={watch('heroImage')}
                  onChange={(v) => setValue('heroImage', { ...(watch('heroImage') || {}), ...v, alt: v.alt || watch('heroImage.alt') }, { shouldValidate: true, shouldDirty: true })}
                  onUploaded={trackUpload}
                  large
                  error={errors.heroImage?.message}
                />
                <div className="mt-2">
                  <Input placeholder="Alt text" {...register('heroImage.alt')} className="h-8 text-sm" />
                </div>
              </div>
            </div>

            <div className="py-4">
              <p className="text-xs font-semibold text-slate-700">Gallery</p>
              <p className="mt-1 text-xs text-slate-500">Additional images/videos displayed on the destination page.</p>
              <div className="mt-3">
                <ImageUploader
                  value={watch('gallery') || []}
                  onChange={(v) => setValue('gallery', v, { shouldValidate: true, shouldDirty: true })}
                  multiple
                  folder="destination-media"
                  onUploaded={trackUpload}
                />
              </div>
              {errors.gallery && <p className="mt-1 text-xs text-destructive">{errors.gallery.message}</p>}
            </div>
          </div>
        )}

        {activeTab === 'publishing' && (
          <div className="border border-slate-200 bg-white p-4">
            <RecordSection title="Publishing">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Status</p>
                  <div className="mt-2 flex gap-4">
                    <label className="flex items-center gap-1.5 text-sm">
                      <input type="radio" checked={!published} onChange={() => setValue('published', false, { shouldDirty: true })} className="h-3.5 w-3.5" />
                      Draft
                    </label>
                    <label className="flex items-center gap-1.5 text-sm">
                      <input type="radio" checked={!!published} onChange={() => setValue('published', true, { shouldDirty: true })} className="h-3.5 w-3.5" />
                      Published
                    </label>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!featured} onChange={(e) => setValue('featured', e.target.checked, { shouldDirty: true })} className="h-3.5 w-3.5" />
                  Featured
                </label>
                <DenseField label="Display Order" error={errors.displayOrder?.message}>
                  <Input type="number" min={0} {...register('displayOrder')} className="h-8 w-24 text-sm" />
                </DenseField>
                {initialValues?.slug && (
                  <a href={`/destination/${initialValues.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900">
                    <Eye className="h-3.5 w-3.5" /> Open destination page
                  </a>
                )}
              </div>
            </RecordSection>

            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-700">Record Information</p>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="font-medium">{published ? 'Published' : 'Draft'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Featured</span><span className="font-medium">{featured ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Slug</span><span className="font-mono text-xs">/{watch('slug') || '—'}</span></div>
              </div>
            </div>


          </div>
        )}

        {activeTab === 'seo' && (
          <div className="border border-slate-200 bg-white p-4">
            <RecordSection title="SEO">
              <div className="space-y-3">
                <DenseField label="SEO Title" error={errors.seoTitle?.message}>
                  <div>
                    <Input placeholder="Sri Lanka Tour Packages" {...register('seoTitle')} className="h-8 text-sm" maxLength={60} />
                    <p className="mt-1 text-right text-xs text-slate-500">{(watch('seoTitle') || '').length} / 60</p>
                  </div>
                </DenseField>
                <DenseField label="SEO Description" error={errors.seoDescription?.message}>
                  <div>
                    <Textarea rows={2} {...register('seoDescription')} className="text-sm" maxLength={160} />
                    <p className="mt-1 text-right text-xs text-slate-500">{(watch('seoDescription') || '').length} / 160</p>
                  </div>
                </DenseField>
                <DenseField label="SEO Keywords" error={errors.seoKeywords?.message}>
                  <Input placeholder="sri lanka, tour packages" {...register('seoKeywords')} className="h-8 text-sm" />
                </DenseField>
              </div>
            </RecordSection>
          </div>
        )}
      </div>

      {/* Sticky save bar — subtle, not amber giant */}
      <div className={`sticky bottom-0 z-20 mt-6 flex items-center justify-between gap-3 border bg-white px-3 py-2 shadow-sm transition-all ${hasDirty ? 'border-slate-200' : 'border-transparent bg-transparent shadow-none'}`}>
        <span className={`text-xs font-medium ${hasDirty ? 'text-slate-700' : 'text-transparent'}`}>{hasDirty ? 'Unsaved changes' : ''}</span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => reset(initialValues || destinationFormDefault)} disabled={!hasDirty || isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting} className="h-8 bg-slate-900 text-white hover:bg-slate-800">
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {isSubmitting ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}

function CompactMediaBlock({ value, onChange, onUploaded, large, error }) {
  const src = value?.secureUrl || value?.url
  const has = !!src
  return (
    <div className={`overflow-hidden rounded-md border bg-white ${has ? 'border-slate-200' : 'border-dashed border-slate-300'}`}>
      {has ? (
        <div className="p-2">
          <img src={src} alt={value.alt || ''} className={`${large ? 'aspect-[16/7]' : 'aspect-[4/3] max-h-[180px]'} w-full object-cover rounded-md border border-slate-100`} />
          <div className="mt-2 flex gap-1.5">
            <div className="flex-1">
              <ImageUploader value={value} onChange={onChange} folder="destination-media" onUploaded={onUploaded} />
            </div>
          </div>
          <div className="mt-1 flex gap-1.5">
            <Button type="button" variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={() => document.querySelector(`[data-media="${value.publicId}"]`)?.click()}>
              Replace
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:bg-red-50" onClick={() => onChange({ url: '', secureUrl: '', publicId: '', alt: '' })}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="rounded bg-slate-100 px-2 py-1 font-medium">Current image</span>
            <span>— No media</span>
          </div>
          <div className="mt-2">
            <ImageUploader value={value} onChange={onChange} folder="destination-media" onUploaded={onUploaded} />
          </div>
        </div>
      )}
      {error && <p className="px-2 pb-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
