import * as React from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { BLOG_CATEGORIES, BLOG_CATEGORY_LABELS, CONTENT_BLOCK_TYPES } from '@/schemas/blog'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { FaqListEditor } from '@/components/trips/FaqListEditor'
import httpClient from '@/services/http'

// ---- schema (mirrors server; author/slug/publishedAt server-controlled) ----
const blockSchema = z.object({
  type: z.enum(CONTENT_BLOCK_TYPES),
  level: z.coerce.number().int().min(2).max(4).optional(),
  text: z.string().trim().max(5000).optional(),
  items: z.array(z.string().trim().max(300)).optional(),
  url: z.string().trim().url('Image URL must be a valid URL').or(z.literal('')).optional(),
  alt: z.string().trim().max(200).optional(),
  caption: z.string().trim().max(300).optional(),
})

const faqFormSchema = z.object({
  question: z.string().trim().min(1, 'Question is required').max(300),
  answer: z.string().trim().max(2000),
  displayOrder: z.coerce.number().int().optional().default(0),
})

export const blogFormSchema = z.object({
  title: z.string().trim().min(3, 'Title is required').max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe')
    .optional()
    .or(z.literal('')),
  excerpt: z.string().trim().min(10, 'Excerpt must be at least 10 characters').max(400),
  content: z.array(blockSchema).min(1, 'Add at least one content block'),
  coverImage: z.object({
    url: z.string().trim().optional().default(''),
    secureUrl: z.string().trim().optional().default(''),
    publicId: z.string().trim().optional().default(''),
    width: z.coerce.number().optional().nullable(),
    height: z.coerce.number().optional().nullable(),
    format: z.string().trim().optional().default(''),
    bytes: z.coerce.number().optional().nullable(),
    alt: z.string().trim().max(200).optional().default(''),
    altText: z.string().trim().max(200).optional().default(''),
  }),
  category: z.enum(BLOG_CATEGORIES),
  tagsInput: z.string().trim(), // comma-separated in UI; split on submit
  destinationId: z.string(),
  faqs: z.array(faqFormSchema).max(30).optional().default([]),
  featured: z.boolean(),
  published: z.boolean(),
  seoTitle: z.string().trim().max(120).optional(),
  seoDescription: z.string().trim().max(300).optional(),
})

export function toBlogPayload(values) {
  return {
    title: values.title,
    ...(values.slug ? { slug: values.slug } : {}),
    excerpt: values.excerpt,
    content: values.content.map((b) => ({
      type: b.type,
      ...(b.type === 'heading' ? { level: Number(b.level) || 2, text: (b.text || '').trim() } : {}),
      ...(b.type === 'paragraph' || b.type === 'quote' ? { text: (b.text || '').trim() } : {}),
      ...(b.type === 'list' ? { items: (b.items || []).map((i) => i.trim()).filter(Boolean) } : {}),
      ...(b.type === 'image' ? { url: (b.url || '').trim(), alt: b.alt || '', caption: b.caption || '' } : {}),
    })),
    coverImage: values.coverImage || { url: '', alt: '' },
    category: values.category,
    tags: values.tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    destinationId: values.destinationId || null,
    faqs: (values.faqs || [])
      .map((f, i) => ({
        question: (f.question || '').trim(),
        answer: (f.answer || '').trim(),
        displayOrder: typeof f.displayOrder === 'number' ? f.displayOrder : i + 1,
      }))
      .filter((f) => f.question && f.answer),
    featured: values.featured,
    published: values.published,
    seoTitle: values.seoTitle || '',
    seoDescription: values.seoDescription || '',
  }
}

function IconBtn({ label, onClick, disabled, danger, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 ${
        danger ? 'text-destructive hover:bg-destructive/10' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

const BLOCK_LABELS = { heading: 'Heading', paragraph: 'Paragraph', list: 'List', image: 'Image', quote: 'Quote' }

function ListItems({ control, index, register }) {
  const { fields, append, remove } = useFieldArray({ control, name: `content.${index}.items` })
  return (
    <div>
      <Label className="text-xs font-semibold text-slate-700">List items *</Label>
      <div className="mt-1.5 space-y-2">
        {fields.map((f, j) => (
          <div key={f.id} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-xs text-muted-foreground">{j + 1}.</span>
            <Input aria-label={`List item ${j + 1}`} {...register(`content.${index}.items.${j}`)} className="h-8 w-full min-w-0 max-w-full text-sm" />
            <IconBtn label={`Remove list item ${j + 1}`} danger onClick={() => remove(j)}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </IconBtn>
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => append('')}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add item
        </Button>
      </div>
    </div>
  )
}

function CoverImageField({ value, onChange, onUploaded }) {
  const has = !!(value?.secureUrl || value?.url)
  const inputRef = React.useRef(null)
  const [dragOver, setDragOver] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(null)
  const [error, setError] = React.useState(null)

  async function uploadFile(file) {
    if (!file) return
    if (!['image/png','image/jpeg','image/jpg','image/webp'].includes(file.type)) { setError('Only PNG, JPG, WEBP allowed'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10 MB'); return }
    setError(null); setUploading(true); setProgress(0)
    try {
      const form = new FormData()
      form.append('image', file)
      const { data } = await httpClient.post('/admin/upload/single?folder=blog-media', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setProgress(Math.round(((e.loaded||0)*100)/(e.total||1))),
      })
      onChange({ ...(value||{}), ...data.data, alt: data.data.alt || value?.alt || '' })
      onUploaded?.(data.data)
    } catch(e) {
      setError(e.response?.data?.message || e.message || 'Upload failed')
    } finally { setUploading(false); setProgress(null) }
  }

  if (has) {
    const src = value.secureUrl || value.url
    const filename = value.publicId ? value.publicId.split('/').pop() : (value.url || '').split('/').pop() || 'cover image'
    return (
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="p-2">
          <img src={src} alt={value.alt || ''} className="max-h-64 w-full rounded-md border border-slate-100 object-contain bg-slate-50" />
          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-700">{filename}</p>
              <p className="truncate text-slate-500">{value.width && value.height ? `${value.width} × ${value.height}` : ''}{value.width && value.bytes ? ' • ' : ''}{value.bytes ? `${(value.bytes/1024).toFixed(1)} KB` : ''}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0 text-xs text-red-600 hover:bg-red-50" onClick={()=>onChange({ url:'', secureUrl:'', publicId:'', alt:'', altText:'' })}>Remove</Button>
          </div>
          <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" className="hidden" onChange={e=>{ uploadFile(e.target.files?.[0]); e.target.value='' }} />
          <div className="mt-2 flex gap-1.5">
            <Button type="button" variant="outline" size="sm" className="h-7 flex-1 text-xs" disabled={uploading} onClick={()=>inputRef.current?.click()}>{uploading ? (progress!=null ? `Uploading… ${progress}%` : 'Uploading…') : 'Replace'}</Button>
          </div>
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={e=>{e.preventDefault(); setDragOver(true)}}
      onDragLeave={()=>setDragOver(false)}
      onDrop={e=>{e.preventDefault(); setDragOver(false); uploadFile(e.dataTransfer.files?.[0])}}
      onClick={()=>inputRef.current?.click()}
      className={`flex h-[200px] w-full min-w-0 max-w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed bg-slate-50 p-6 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-slate-400'} ${uploading ? 'pointer-events-none opacity-60' : ''}`}
    >
      <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" className="hidden" onChange={e=>{ uploadFile(e.target.files?.[0]); e.target.value='' }} />
      {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-slate-400" />}
      <p className="mt-2 text-sm font-medium text-slate-700">{dragOver ? 'Drop image here' : 'Drag & drop image here'}</p>
      <p className="text-xs text-slate-500">or click to browse</p>
      <Button type="button" variant="outline" size="sm" className="mt-3 h-7 text-xs" onClick={e=>{e.stopPropagation(); inputRef.current?.click()}}>Choose Image</Button>
      <p className="mt-2 text-xs text-slate-500">PNG, JPG, WEBP • Max 10 MB</p>
      {progress!=null && <p className="mt-1 text-xs text-primary">{progress}%</p>}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function BlogForm({ initialValues, destinations = [], isSubmitting, submitLabel, onSubmit }) {
  const defaults = React.useMemo(() => {
    const base = initialValues || {}
    return {
      title: base.title || '',
      slug: base.slug || '',
      excerpt: base.excerpt || '',
      content: base.content?.length
        ? base.content.map((b) => ({ ...b, items: b.items?.length ? b.items : [''], level: b.level || 2 }))
        : [{ type: 'paragraph', text: '' }],
      coverImage: base.coverImage || { url: '', alt: '', secureUrl: '', publicId: '' },
      category: base.category || 'travel-guide',
      tagsInput: (base.tags || []).join(', '),
      destinationId: base.destinationId || base.destination?.id || '',
      faqs: Array.isArray(base.faqs)
        ? base.faqs.map((f) => ({ question: f.question || '', answer: f.answer || '', displayOrder: f.displayOrder ?? 0 }))
        : [],
      featured: !!base.featured,
      published: !!base.published,
      seoTitle: base.seoTitle || '',
      seoDescription: base.seoDescription || '',
    }
  }, [initialValues])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(blogFormSchema),
    defaultValues: defaults,
  })

  const published = watch('published')
  const featured = watch('featured')

  function submit(values) {
    onSubmit(toBlogPayload(values))
  }

  const handleSaveDraft = () => {
    setValue('published', false, { shouldDirty: true, shouldValidate: true })
    setTimeout(()=> handleSubmit(submit)(), 0)
  }
  const handlePublish = () => {
    setValue('published', true, { shouldDirty: true, shouldValidate: true })
    setTimeout(()=> handleSubmit(submit)(), 0)
  }

  const isEdit = !!initialValues?.id

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="w-full min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-[22px]">{isEdit ? 'Edit travel blog' : 'New travel blog'}</h1>
          <p className="mt-1 text-xs text-slate-500">Write and publish a travel story.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" disabled={isSubmitting} onClick={handleSaveDraft}>
            {isSubmitting && !published ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Save Draft
          </Button>
          <Button type="button" size="sm" className="h-8 bg-slate-900 text-white hover:bg-slate-800 text-xs" disabled={isSubmitting} onClick={handlePublish}>
            {isSubmitting && published ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Publish
          </Button>
        </div>
      </div>

      <div className="space-y-0 divide-y divide-slate-200 border-x border-b border-slate-200 bg-white">
        {/* Article */}
        <div className="p-4 sm:p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Article</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="b-title" className="text-xs font-semibold text-slate-700">Title *</Label>
              <Input id="b-title" {...register('title')} className="mt-1 h-9 w-full min-w-0 max-w-full text-sm" placeholder="Leh Ladakh: Complete Travel Guide" aria-invalid={!!errors.title} />
              {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="b-slug" className="text-xs font-semibold text-slate-700">Slug</Label>
              <Input id="b-slug" {...register('slug')} className="mt-1 h-9 w-full min-w-0 max-w-full text-sm" placeholder="auto-generated from title if blank" />
              <p className="mt-1 text-xs text-slate-500">Auto-generated from title if blank. URL: /blog/{watch('slug') || 'your-slug'}</p>
              {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>}
            </div>
            <div className="min-w-0">
              <Label htmlFor="b-category" className="text-xs font-semibold text-slate-700">Category *</Label>
              <Select id="b-category" {...register('category')} className="mt-1 h-9 w-full min-w-0 max-w-full text-sm">
                {BLOG_CATEGORIES.map(c=> <option key={c} value={c}>{BLOG_CATEGORY_LABELS[c]}</option>)}
              </Select>
            </div>
            <div className="min-w-0">
              <Label htmlFor="b-dest" className="text-xs font-semibold text-slate-700">Destination</Label>
              <Select id="b-dest" {...register('destinationId')} className="mt-1 h-9 w-full min-w-0 max-w-full text-sm">
                <option value="">No destination</option>
                {destinations.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="b-tags" className="text-xs font-semibold text-slate-700">Tags</Label>
              <Input id="b-tags" {...register('tagsInput')} className="mt-1 h-9 w-full min-w-0 max-w-full text-sm" placeholder="mountains, adventure, guide" />
              <p className="mt-1 text-xs text-slate-500">Comma separated.</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Content</h3>
          <p className="mt-1 text-xs text-slate-500">The rich-text editor is the primary writing area. Excerpt is a short summary for cards.</p>

          <div className="mt-4">
            <Label htmlFor="b-excerpt" className="text-xs font-semibold text-slate-700">Excerpt *</Label>
            <p className="text-xs text-slate-500">Short summary shown on blog cards and previews. 10–400 characters.</p>
            <div className="mt-2">
              <Textarea id="b-excerpt" rows={3} {...register('excerpt')} className="w-full min-w-0 max-w-full text-sm" placeholder="A quick 2-3 line summary of the story…" maxLength={400} />
            </div>
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-slate-500">{(watch('excerpt')||'').length} / 400</span>
              {errors.excerpt && <span className="text-destructive">{errors.excerpt.message}</span>}
            </div>
          </div>

          <div className="mt-5">
            <Label className="text-xs font-semibold text-slate-700">Content *</Label>
            <p className="text-xs text-slate-500">Full blog content. Use headings, lists, quotes and images.</p>
            <div className="mt-2">
              <ContentBlocks control={control} register={register} watch={watch} setValue={setValue} errors={errors} />
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="p-4 sm:p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">FAQs</h3>
          <p className="mt-1 text-xs text-slate-500">Answer common questions travellers may have about this destination or topic.</p>
          <div className="mt-3">
            <FaqListEditor control={control} />
          </div>
          {errors.faqs && <p className="mt-2 text-xs text-destructive">{errors.faqs.message}</p>}
        </div>

        {/* Cover Image */}
        <div className="p-4 sm:p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Cover image</h3>
          <p className="mt-1 text-xs text-slate-500">Used as the main image for the blog.</p>
          <div className="mt-3">
            <CoverImageField value={watch('coverImage')} onChange={(v)=> setValue('coverImage', v, {shouldValidate:true, shouldDirty:true})} />
            <div className="mt-3">
              <Label htmlFor="b-cover-alt" className="text-xs font-semibold text-slate-700">Alt text</Label>
              <Input id="b-cover-alt" {...register('coverImage.alt')} className="mt-1 h-8 w-full min-w-0 max-w-full text-sm" placeholder="Describe the cover image for accessibility" />
            </div>
          </div>
        </div>

        {/* Publishing */}
        <div className="p-4 sm:p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Publishing</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <Label htmlFor="b-status" className="text-xs font-semibold text-slate-700">Status</Label>
              <Select id="b-status" value={published ? 'published' : 'draft'} onChange={e=> setValue('published', e.target.value==='published', {shouldDirty:true, shouldValidate:true})} className="mt-1 h-9 w-full min-w-0 max-w-full text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </div>
            <div className="flex items-end gap-6 pb-1">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={featured} onCheckedChange={v=> setValue('featured', !!v, {shouldDirty:true})} />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={published} onCheckedChange={v=> setValue('published', !!v, {shouldDirty:true})} />
                Published
              </label>
            </div>
            {initialValues?.publishedAt && (
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500">Published at: {new Date(initialValues.publishedAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* SEO */}
        <div className="p-4 sm:p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">SEO</h3>
          <div className="mt-3 grid gap-4">
            <div className="min-w-0">
              <Label htmlFor="b-seotitle" className="text-xs font-semibold text-slate-700">SEO title</Label>
              <Input id="b-seotitle" {...register('seoTitle')} className="mt-1 h-9 w-full min-w-0 max-w-full text-sm" placeholder="Leave blank to use article title" maxLength={120} />
              <p className="mt-1 text-right text-xs text-slate-500">{(watch('seoTitle')||'').length} / 120</p>
            </div>
            <div className="min-w-0">
              <Label htmlFor="b-seodesc" className="text-xs font-semibold text-slate-700">Meta description</Label>
              <Textarea id="b-seodesc" rows={2} {...register('seoDescription')} className="w-full min-w-0 max-w-full text-sm" placeholder="Short description for search engines" maxLength={300} />
              <p className="mt-1 text-right text-xs text-slate-500">{(watch('seoDescription')||'').length} / 300</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`sticky bottom-0 z-10 mt-4 flex items-center justify-between gap-3 border bg-white px-3 py-2 shadow-sm ${isDirty ? 'border-slate-200' : 'border-transparent bg-transparent shadow-none'}`}>
        <span className={`text-xs font-medium ${isDirty ? 'text-slate-700' : 'text-transparent'}`}>{isDirty ? 'Unsaved changes' : ''}</span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={handleSaveDraft} disabled={isSubmitting}>Save Draft</Button>
          <Button type="button" size="sm" className="h-8 bg-slate-900 text-white hover:bg-slate-800 text-xs" onClick={handlePublish} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {isSubmitting ? 'Saving…' : (submitLabel || (isEdit ? 'Update' : 'Publish'))}
          </Button>
        </div>
      </div>
    </form>
  )
}

// Content block editor (own component so useFieldArray stays hook-legal).
function ContentBlocks({ control, register, watch, setValue, errors }) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'content' })

  const addBlock = (type) =>
    append(
      type === 'heading'
        ? { type, level: 2, text: '' }
        : type === 'paragraph' || type === 'quote'
          ? { type, text: '' }
          : type === 'list'
            ? { type, items: [''] }
            : { type, url: '', alt: '', caption: '' }
    )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Add a content block">
        {[['heading', 'Heading'], ['paragraph', 'Paragraph'], ['list', 'List'], ['image', 'Image (URL)'], ['quote', 'Quote']].map(
          ([type, label]) => (
            <Button key={type} type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => addBlock(type)}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </Button>
          )
        )}
      </div>

      {!fields.length && (
        <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No content blocks yet — add a heading or paragraph to start writing.
        </p>
      )}

      {typeof errors.content?.message === 'string' && (
        <p className="text-xs text-destructive">{errors.content.message}</p>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
          <input type="hidden" {...register(`content.${index}.type`)} />
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center rounded bg-white px-2 py-0.5 text-xs font-medium ring-1 ring-slate-200">
              {index + 1}. {BLOCK_LABELS[field.type] || field.type}
            </span>
            <div className="flex items-center gap-1">
              <IconBtn label={`Move block ${index + 1} up`} disabled={index === 0} onClick={() => move(index, index - 1)}>
                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              </IconBtn>
              <IconBtn label={`Move block ${index + 1} down`} disabled={index === fields.length - 1} onClick={() => move(index, index + 1)}>
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </IconBtn>
              <IconBtn label={`Remove block ${index + 1}`} danger onClick={() => remove(index)}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </IconBtn>
            </div>
          </div>

          {field.type === 'heading' && (
            <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
              <div className="min-w-0">
                <Label htmlFor={`c-${index}-level`} className="text-xs font-semibold text-slate-700">Level</Label>
                <Select id={`c-${index}-level`} className="mt-1 h-8 w-full min-w-0 max-w-full text-sm" {...register(`content.${index}.level`)}>
                  <option value="2">H2</option>
                  <option value="3">H3</option>
                  <option value="4">H4</option>
                </Select>
              </div>
              <div className="min-w-0">
                <Label htmlFor={`c-${index}-text`} className="text-xs font-semibold text-slate-700">Heading text *</Label>
                <Input id={`c-${index}-text`} className="mt-1 h-8 w-full min-w-0 max-w-full text-sm" {...register(`content.${index}.text`)} />
                {errors.content?.[index]?.text && (
                  <p className="mt-1 text-xs text-destructive">{errors.content[index].text.message}</p>
                )}
              </div>
            </div>
          )}

          {(field.type === 'paragraph' || field.type === 'quote') && (
            <div className="min-w-0">
              <Label htmlFor={`c-${index}-text`} className="text-xs font-semibold text-slate-700">
                {field.type === 'paragraph' ? 'Paragraph *' : 'Quote *'}
              </Label>
              <div className="mt-1">
                <RichTextEditor
                  value={watch ? watch(`content.${index}.text`) || '' : ''}
                  onChange={(html) => setValue && setValue(`content.${index}.text`, html, { shouldValidate: true, shouldDirty: true })}
                  placeholder={field.type === 'paragraph' ? 'Paragraph text…' : 'Quote text…'}
                  error={!!errors.content?.[index]?.text}
                  className="min-h-[180px]"
                />
              </div>
              {errors.content?.[index]?.text && (
                <p className="mt-1 text-xs text-destructive">{errors.content[index].text.message}</p>
              )}
            </div>
          )}

          {field.type === 'list' && <ListItems control={control} index={index} register={register} />}

          {field.type === 'image' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 min-w-0">
                <Label htmlFor={`c-${index}-url`} className="text-xs font-semibold text-slate-700">Image URL *</Label>
                <Input id={`c-${index}-url`} type="url" className="mt-1 h-8 w-full min-w-0 max-w-full text-sm" placeholder="https://…" {...register(`content.${index}.url`)} />
                {errors.content?.[index]?.url && (
                  <p className="mt-1 text-xs text-destructive">{errors.content[index].url.message}</p>
                )}
              </div>
              <div className="min-w-0">
                <Label htmlFor={`c-${index}-alt`} className="text-xs font-semibold text-slate-700">Alt text</Label>
                <Input id={`c-${index}-alt`} className="mt-1 h-8 w-full min-w-0 max-w-full text-sm" {...register(`content.${index}.alt`)} />
              </div>
              <div className="min-w-0">
                <Label htmlFor={`c-${index}-caption`} className="text-xs font-semibold text-slate-700">Caption</Label>
                <Input id={`c-${index}-caption`} className="mt-1 h-8 w-full min-w-0 max-w-full text-sm" {...register(`content.${index}.caption`)} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
