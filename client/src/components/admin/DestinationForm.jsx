import * as React from 'react'
import { useNavigate } from 'react-router-dom'
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
import httpClient from '@/services/http'
import { toast } from 'sonner'

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
    <div className="min-w-0 max-w-full">
      <Label className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-600">*</span>}
      </Label>
      <div className="mt-1 min-w-0 max-w-full">{children}</div>
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
  const navigate = useNavigate()
  const [editorExpanded, setEditorExpanded] = React.useState(false)

  const prevInitialIdRef = React.useRef(null)
  React.useEffect(() => {
    const id = initialValues?.id || initialValues?.slug || (initialValues ? 'edit' : 'create')
    if (id !== prevInitialIdRef.current) {
      reset(initialValues || destinationFormDefault)
      prevInitialIdRef.current = id
    }
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

  const onInvalid = React.useCallback((errorsObj) => {
    // If validation fails for a field in a hidden tab, switch to that tab so the error becomes visible
    const tabForField = {
      name: 'details', slug: 'details', country: 'details', region: 'details', type: 'details', category: 'details',
      description: 'content',
      homepageImage: 'media', homepageName: 'media', heroImage: 'media', heroVideo: 'media', gallery: 'media',
      published: 'publishing', featured: 'publishing', displayOrder: 'publishing',
      seoTitle: 'seo', seoDescription: 'seo', seoKeywords: 'seo',
    }
    const firstKey = errorsObj ? Object.keys(errorsObj)[0] : null
    if (firstKey) {
      let targetTab = tabForField[firstKey]
      // Handle nested image errors like homepageImage.url
      if (!targetTab) {
        if (firstKey.startsWith('homepage') || firstKey.startsWith('hero') || firstKey === 'gallery') targetTab = 'media'
        else if (firstKey.startsWith('seo')) targetTab = 'seo'
      }
      if (targetTab && targetTab !== activeTab) {
        setActiveTab(targetTab)
        const msg = errorsObj[firstKey]?.message || (typeof errorsObj[firstKey] === 'object' ? Object.values(errorsObj[firstKey])[0]?.message : null)
        if (msg) toast.error(msg)
      }
    }
    setTimeout(() => {
      const el = document.querySelector('[aria-invalid="true"]')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }, [activeTab])

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

      {/* Tab content — full width, not narrow centered card */}
      <div className="w-full min-w-0 max-w-full bg-white overflow-hidden">
        {activeTab === 'details' && (
          <div className="space-y-0 divide-y divide-slate-200 border border-slate-200 bg-white">
            <div className="p-4">
              <RecordSection title="Basic Information">
                <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-4">
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
                  {initialValues && (
                    <DenseField label="Type" error={errors.type?.message}>
                      <Select {...register('type')} className="h-8 text-sm">
                        {DESTINATION_TYPES.map((t) => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}</option>
                        ))}
                      </Select>
                    </DenseField>
                  )}
                  <DenseField label="Market Category" error={errors.category?.message}>
                    <Select
                      value={Array.isArray(watch('category')) ? (watch('category').includes('domestic') && watch('category').includes('weekend') ? 'domestic & weekend' : watch('category')[0] || 'other') : watch('category') || 'other'}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === 'domestic & weekend') setValue('category', ['domestic', 'weekend'], { shouldDirty: true, shouldValidate: true })
                        else setValue('category', v, { shouldDirty: true, shouldValidate: true })
                      }}
                      className="h-8 text-sm"
                    >
                      {DESTINATION_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c === 'domestic & weekend' ? 'Domestic & Weekend' : c.charAt(0).toUpperCase() + c.slice(1)}
                        </option>
                      ))}
                    </Select>
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
                <div className="mt-3">
                  <DenseField
                    label="Homepage Destination Name"
                    error={errors.homepageName?.message}
                    hint="Shown on: Homepage → Explore Destinations. Enter it explicitly — the main Destination Name above is not used automatically."
                  >
                    <Input placeholder="Sri Lanka" {...register('homepageName')} className="h-8 text-sm" aria-invalid={!!errors.homepageName} />
                  </DenseField>
                </div>
              </div>
            </div>

            <div className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Destination Page Hero</p>
                  <p className="mt-1 text-xs text-slate-500">Shown at the top of /destination/{watch('slug') || 'slug'}</p>
                  <p className="mt-1 text-xs text-slate-500">Choose one hero media. You can upload either an image or a video.</p>
                </div>
              </div>
              <HeroMediaField
                heroImage={watch('heroImage')}
                heroVideo={watch('heroVideo')}
                onChangeImage={(v) => setValue('heroImage', v, { shouldValidate: true, shouldDirty: true })}
                onChangeVideo={(v) => setValue('heroVideo', v, { shouldValidate: true, shouldDirty: true })}
                onUploaded={trackUpload}
                heroImageError={errors.heroImage?.message}
                heroVideoError={errors.heroVideo?.message}
                registerAlt={register('heroImage.alt')}
                altError={errors.heroImage?.alt?.message}
              />
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => navigate('/admin/destinations')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting} className="h-8 bg-slate-900 text-white hover:bg-slate-800">
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {isSubmitting ? (initialValues ? 'Saving…' : 'Creating…') : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}

function HeroMediaField({ heroImage, heroVideo, onChangeImage, onChangeVideo, onUploaded, heroImageError, heroVideoError, registerAlt, altError }) {
  const hasImage = !!(heroImage?.secureUrl || heroImage?.url)
  const hasVideo = !!(heroVideo?.secureUrl || heroVideo?.url)
  const [active, setActive] = React.useState(() => {
    if (hasVideo) return 'video'
    if (hasImage) return 'image'
    return 'image'
  })
  const initialHasVideo = React.useRef(hasVideo)
  const initialHasImage = React.useRef(hasImage)
  React.useEffect(() => {
    if (initialHasVideo.current && initialHasImage.current) setActive('video')
    else if (initialHasVideo.current) setActive('video')
    else if (initialHasImage.current) setActive('image')
  }, [])
  // Replace controls for already-uploaded media (compact, not a giant dashed box)
  const replaceImageInputRef = React.useRef(null)
  const replaceVideoInputRef = React.useRef(null)
  const [replacingImage, setReplacingImage] = React.useState(false)
  const [replacingVideo, setReplacingVideo] = React.useState(false)
  const [replaceImageProgress, setReplaceImageProgress] = React.useState(null)
  const [replaceVideoProgress, setReplaceVideoProgress] = React.useState(null)
  const [replaceImageError, setReplaceImageError] = React.useState(null)
  const [replaceVideoError, setReplaceVideoError] = React.useState(null)

  const handleImageUploaded = (meta) => {
    onChangeImage({ ...(heroImage || {}), ...meta, alt: meta.alt || heroImage?.alt || '' })
    if (hasVideo) onChangeVideo({ url: '', secureUrl: '', publicId: '', alt: '' })
    onUploaded?.(meta)
  }
  const handleVideoUploaded = (meta) => {
    onChangeVideo(meta)
    if (hasImage) onChangeImage({ url: '', secureUrl: '', publicId: '', alt: heroImage?.alt || '' })
    onUploaded?.(meta)
  }
  const handleRemoveImage = () => onChangeImage({ url: '', secureUrl: '', publicId: '', alt: '' })
  const handleRemoveVideo = () => onChangeVideo({ url: '', secureUrl: '', publicId: '', alt: '' })
  async function handleReplaceImageFile(file) {
    if (!file) return
    if (!['image/png','image/jpeg','image/jpg','image/webp'].includes(file.type)) { setReplaceImageError('Only PNG, JPG, WEBP allowed'); return }
    if (file.size > 10 * 1024 * 1024) { setReplaceImageError('Image must be under 10 MB'); return }
    setReplaceImageError(null); setReplacingImage(true); setReplaceImageProgress(0)
    try {
      const form = new FormData(); form.append('image', file)
      const { data } = await httpClient.post('/admin/upload/single?folder=destination-media', form, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress: e=> setReplaceImageProgress(Math.round(((e.loaded||0)*100)/(e.total||1))) })
      handleImageUploaded(data.data)
    } catch(e){ setReplaceImageError(e.response?.data?.message || e.message || 'Upload failed') } finally { setReplacingImage(false); setReplaceImageProgress(null) }
  }
  async function handleReplaceVideoFile(file) {
    if (!file) return
    if (!['video/mp4','video/webm'].includes(file.type)) { setReplaceVideoError('Only MP4/WebM allowed'); return }
    if (file.size > 100 * 1024 * 1024) { setReplaceVideoError('Video must be under 100 MB'); return }
    setReplaceVideoError(null); setReplacingVideo(true); setReplaceVideoProgress(0)
    try {
      const form = new FormData(); form.append('video', file)
      const { data } = await httpClient.post('/admin/upload/video?folder=destination-media', form, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress: e=> setReplaceVideoProgress(Math.round(((e.loaded||0)*100)/(e.total||1))) })
      handleVideoUploaded(data.data)
    } catch(e){ setReplaceVideoError(e.response?.data?.message || e.message || 'Upload failed') } finally { setReplacingVideo(false); setReplaceVideoProgress(null) }
  }
  const error = active === 'image' ? heroImageError : heroVideoError
  return (
    <div className="mt-3 min-w-0 max-w-full">
      <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setActive('image')}
          className={`rounded px-4 py-1.5 text-xs font-semibold transition-colors ${active === 'image' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Image
        </button>
        <button
          type="button"
          onClick={() => setActive('video')}
          className={`rounded px-4 py-1.5 text-xs font-semibold transition-colors ${active === 'video' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Video
        </button>
      </div>
      <div className="mt-3">
        {active === 'image' ? (
          <div className="min-w-0 max-w-full">
            {hasImage ? (
              <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <div className="p-2">
                  <img src={heroImage.secureUrl || heroImage.url} alt={heroImage.alt || ''} className="max-h-60 w-full object-contain rounded-md border border-slate-100 bg-slate-50" />
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-700">{heroImage.publicId ? heroImage.publicId.split('/').pop() : (heroImage.url || '').split('/').pop() || 'hero image'}</p>
                      <p className="truncate text-slate-500">{heroImage.width && heroImage.height ? `${heroImage.width} × ${heroImage.height}` : ''}{heroImage.width && heroImage.bytes ? ' • ' : ''}{heroImage.bytes ? `${(heroImage.bytes / 1024).toFixed(1)} KB` : ''}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0 text-xs text-red-600 hover:bg-red-50" onClick={handleRemoveImage}>Remove</Button>
                  </div>
                  <input ref={replaceImageInputRef} type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" className="hidden" onChange={e=>{ handleReplaceImageFile(e.target.files?.[0]); e.target.value='' }} />
                  <div className="mt-2 flex items-center gap-1.5">
                    <Button type="button" variant="outline" size="sm" className="h-7 flex-1 text-xs" disabled={replacingImage} onClick={() => replaceImageInputRef.current?.click()}>
                      {replacingImage ? (replaceImageProgress!=null ? `Uploading… ${replaceImageProgress}%` : 'Uploading…') : 'Replace Image'}
                    </Button>
                  </div>
                  {(replaceImageError) && <p className="mt-1 text-xs text-destructive">{replaceImageError}</p>}
                </div>
              </div>
            ) : (
              <HeroImageUploadArea onUploaded={handleImageUploaded} />
            )}
            <div className="mt-3">
              <Label className="text-xs font-semibold text-slate-700">Alt text</Label>
              <Input placeholder="Describe the hero image..." {...registerAlt} className="mt-1 h-8 w-full min-w-0 max-w-full text-sm" />
              {altError && <p className="mt-1 text-xs text-destructive">{altError}</p>}
            </div>
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          </div>
        ) : (
          <div className="min-w-0 max-w-full">
            {hasVideo ? (
              <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <div className="p-2">
                  <div className="relative">
                    <video src={heroVideo.secureUrl || heroVideo.url} controls muted playsInline preload="metadata" className="max-h-60 w-full rounded-md border border-slate-100 bg-black object-contain" />
                    <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">Video</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-700">{heroVideo.publicId ? heroVideo.publicId.split('/').pop() : (heroVideo.url || '').split('/').pop() || 'hero video'}</p>
                      <p className="truncate text-slate-500">{heroVideo.bytes ? `${(heroVideo.bytes / 1024 / 1024).toFixed(2)} MB` : ''}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0 text-xs text-red-600 hover:bg-red-50" onClick={handleRemoveVideo}>Remove</Button>
                  </div>
                  <input ref={replaceVideoInputRef} type="file" accept="video/mp4,video/webm,.mp4,.webm" className="hidden" onChange={e=>{ handleReplaceVideoFile(e.target.files?.[0]); e.target.value='' }} />
                  <div className="mt-2 flex items-center gap-1.5">
                    <Button type="button" variant="outline" size="sm" className="h-7 flex-1 text-xs" disabled={replacingVideo} onClick={() => replaceVideoInputRef.current?.click()}>
                      {replacingVideo ? (replaceVideoProgress!=null ? `Uploading… ${replaceVideoProgress}%` : 'Uploading…') : 'Replace Video'}
                    </Button>
                  </div>
                  {(replaceVideoError) && <p className="mt-1 text-xs text-destructive">{replaceVideoError}</p>}
                </div>
              </div>
            ) : (
              <HeroVideoUploadArea onUploaded={handleVideoUploaded} />
            )}
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
function HeroImageUploadArea({ onUploaded }) {
  const [dragOver, setDragOver] = React.useState(false)
  const inputRef = React.useRef(null)
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(null)
  const [error, setError] = React.useState(null)
  const handleFiles = async (files) => {
    const file = files[0]
    if (!file) return
    if (!['image/png','image/jpeg','image/jpg','image/webp'].includes(file.type)) { setError('Only PNG, JPG, WEBP allowed'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10 MB'); return }
    setError(null); setUploading(true); setProgress(0)
    try {
      const form = new FormData(); form.append('image', file)
      const { data } = await httpClient.post('/admin/upload/single?folder=destination-media', form, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress: e=> setProgress(Math.round(((e.loaded||0)*100)/(e.total||1))) })
      onUploaded(data.data)
    } catch(e){ setError(e.response?.data?.message || e.message || 'Upload failed') } finally { setUploading(false); setProgress(null) }
  }
  return (
    <div
      onDragOver={e=>{e.preventDefault(); setDragOver(true)}}
      onDragLeave={()=>setDragOver(false)}
      onDrop={e=>{e.preventDefault(); setDragOver(false); handleFiles(Array.from(e.dataTransfer.files||[]))}}
      onClick={()=>inputRef.current?.click()}
      className={`flex h-[200px] w-full min-w-0 max-w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed bg-slate-50 p-6 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-slate-400'} ${uploading ? 'pointer-events-none opacity-60' : ''}`}
    >
      <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" className="hidden" onChange={e=>{ handleFiles(Array.from(e.target.files||[])); e.target.value='' }} />
      {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <UploadIcon />}
      <p className="mt-2 text-sm font-medium text-slate-700">{dragOver ? 'Drop image here' : 'Drag & drop image here'}</p>
      <p className="text-xs text-slate-500">or click to browse</p>
      <Button type="button" variant="outline" size="sm" className="mt-3 h-7 text-xs" onClick={e=>{e.stopPropagation(); inputRef.current?.click()}}>Choose Image</Button>
      <p className="mt-2 text-xs text-slate-500">PNG, JPG, WEBP • Max 10 MB</p>
      {progress!=null && <p className="mt-1 text-xs text-primary">{progress}%</p>}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
function UploadIcon(){ return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-slate-400"><path d="M12 16V4M12 4l-4 4M12 4l4 4"/><path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"/></svg> }
function HeroVideoUploadArea({ onUploaded }) {
  const inputRef = React.useRef(null)
  const [dragOver, setDragOver] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(null)
  const [error, setError] = React.useState(null)
  const handleFiles = async (files) => {
    const file = files[0]
    if (!file) return
    if (!['video/mp4','video/webm'].includes(file.type)) { setError('Only MP4/WebM allowed'); return }
    if (file.size > 100 * 1024 * 1024) { setError('Video must be under 100 MB'); return }
    setError(null); setUploading(true); setProgress(0)
    try {
      const form = new FormData(); form.append('video', file)
      const { data } = await httpClient.post('/admin/upload/video?folder=destination-media', form, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress: e=> setProgress(Math.round(((e.loaded||0)*100)/(e.total||1))) })
      onUploaded(data.data)
    } catch(e){ setError(e.response?.data?.message || e.message || 'Upload failed') } finally { setUploading(false); setProgress(null) }
  }
  return (
    <div
      onDragOver={e=>{e.preventDefault(); setDragOver(true)}}
      onDragLeave={()=>setDragOver(false)}
      onDrop={e=>{e.preventDefault(); setDragOver(false); handleFiles(Array.from(e.dataTransfer.files||[]))}}
      onClick={()=>inputRef.current?.click()}
      className={`flex h-[200px] w-full min-w-0 max-w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed bg-slate-50 p-6 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-slate-400'} ${uploading ? 'pointer-events-none opacity-60' : ''}`}
    >
      <input ref={inputRef} type="file" accept="video/mp4,video/webm,.mp4,.webm" className="hidden" onChange={e=>{ handleFiles(Array.from(e.target.files||[])); e.target.value='' }} />
      {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-slate-400"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M18 10l4-2v8l-4-2z"/></svg>}
      <p className="mt-2 text-sm font-medium text-slate-700">{dragOver ? 'Drop video here' : 'Drag & drop video here'}</p>
      <p className="text-xs text-slate-500">or click to browse</p>
      <Button type="button" variant="outline" size="sm" className="mt-3 h-7 text-xs" onClick={e=>{e.stopPropagation(); inputRef.current?.click()}}>Choose Video</Button>
      <p className="mt-2 text-xs text-slate-500">MP4 / WebM • Max 100 MB</p>
      {progress!=null && <p className="mt-1 text-xs text-primary">{progress}%</p>}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
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

function CompactVideoBlock({ value, onChange, onUploaded, error }) {
  const src = value?.secureUrl || value?.url
  const has = !!src
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(null)
  const [uploadError, setUploadError] = React.useState(null)
  const inputRef = React.useRef(null)

  async function handleFile(file) {
    if (!file) return
    setUploadError(null)
    setUploading(true)
    setProgress(0)
    try {
      const form = new FormData()
      form.append('video', file)
      const { data } = await httpClient.post('/admin/upload/video?folder=destination-media', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round(((e.loaded || 0) * 100) / (e.total || 1))),
      })
      onChange(data.data)
      onUploaded?.(data.data)
    } catch (e) {
      setUploadError(e.response?.data?.message || e.message || 'Video upload failed')
    } finally {
      setUploading(false)
      setProgress(null)
    }
  }

  return (
    <div className={`overflow-hidden rounded-md border bg-white ${has ? 'border-slate-200' : 'border-dashed border-slate-300'}`}>
      {has ? (
        <div className="p-2">
          <video src={src} controls muted playsInline preload="metadata" className="aspect-[16/7] w-full rounded-md border border-slate-100 bg-black" />
          <div className="mt-2 flex gap-1.5">
            <Button type="button" variant="outline" size="sm" className="h-7 flex-1 text-xs" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {uploading ? `Uploading… ${progress ?? 0}%` : 'Replace'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-red-600 hover:bg-red-50"
              onClick={() => onChange({ url: '', secureUrl: '', publicId: '', alt: '' })}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="rounded bg-slate-100 px-2 py-1 font-medium">Current video</span>
            <span>— No video</span>
          </div>
          <div className="mt-2">
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {uploading ? `Uploading… ${progress ?? 0}%` : 'Upload video'}
            </Button>
            <p className="mt-1 text-xs text-slate-500">MP4 or WebM — max 100 MB</p>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {(uploadError || error) && <p className="px-2 pb-2 text-xs text-destructive">{uploadError || error}</p>}
    </div>
  )
}
