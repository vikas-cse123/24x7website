import * as React from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { BLOG_CATEGORIES, BLOG_CATEGORY_LABELS, CONTENT_BLOCK_TYPES } from '@/schemas/blog'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

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

// Editable items for one list block.
function ListItems({ control, index }) {
  const { fields, append, remove } = useFieldArray({ control, name: `content.${index}.items` })
  return (
    <div>
      <Label>List items *</Label>
      <div className="mt-1.5 space-y-2">
        {fields.map((f, j) => (
          <div key={f.id} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-xs text-muted-foreground">{j + 1}.</span>
            <Input aria-label={`List item ${j + 1}`} {...register(`content.${index}.items.${j}`)} />
            <IconBtn label={`Remove list item ${j + 1}`} danger onClick={() => remove(j)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </IconBtn>
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => append('')}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add item
        </Button>
      </div>
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
      coverImage: base.coverImage || { url: '', alt: '' },
      category: base.category || 'travel-guide',
      tagsInput: (base.tags || []).join(', '),
      destinationId: base.destinationId || base.destination?.id || '',
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
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(blogFormSchema),
    defaultValues: defaults,
  })

  const coverUrl = watch('coverImage.url')

  function submit(values) {
    onSubmit(toBlogPayload(values))
  }

  const eMsg = (obj) =>
    typeof obj === 'string' || obj?.message ? obj?.message || obj : null

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Article</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="b-title">Title *</Label>
            <Input id="b-title" className="mt-1.5" aria-invalid={!!errors.title} {...register('title')} />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="b-slug">Slug</Label>
            <Input id="b-slug" className="mt-1.5" placeholder="auto-generated from the title if blank" {...register('slug')} />
            {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="b-excerpt">Excerpt *</Label>
            <div className="mt-1.5">
              <RichTextEditor
                value={watch('excerpt') || ''}
                onChange={(html) => setValue('excerpt', html, { shouldValidate: true, shouldDirty: true })}
                placeholder="Excerpt…"
                error={!!errors.excerpt}
              />
            </div>
            {errors.excerpt && <p className="mt-1 text-xs text-destructive">{errors.excerpt.message}</p>}
          </div>
          <div>
            <Label htmlFor="b-category">Category *</Label>
            <Select id="b-category" className="mt-1.5" {...register('category')}>
              {BLOG_CATEGORIES.map((c) => (
                <option key={c} value={c}>{BLOG_CATEGORY_LABELS[c]}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="b-dest">Destination</Label>
            <Select id="b-dest" className="mt-1.5" {...register('destinationId')}>
              <option value="">No destination</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}{d.country ? ` — ${d.country}` : ''}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="b-tags">Tags</Label>
            <Input id="b-tags" className="mt-1.5" placeholder="comma, separated, tags" {...register('tagsInput')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Cover image</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Cover image</Label>
            <div className="mt-1.5">
              <ImageUploader value={watch('coverImage')} onChange={(v)=> setValue('coverImage', {...(watch('coverImage')||{}), ...v, alt: v.alt || watch('coverImage.alt')}, {shouldValidate:true, shouldDirty:true})} folder="blog-media" />
            </div>
            <div className="mt-2"><Input placeholder="Alt text" {...register('coverImage.alt')} /></div>
          </div>
          {coverUrl && (
            <DestinationImage image={watch('coverImage')} alt="Cover preview" className="aspect-[16/8] w-full rounded-xl" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content</CardTitle>
        </CardHeader>
        <CardContent>
          <ContentBlocks control={control} register={register} watch={watch} setValue={setValue} errors={errors} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">SEO &amp; publishing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="b-seotitle">SEO title</Label>
            <Input id="b-seotitle" className="mt-1.5" maxLength={120} {...register('seoTitle')} />
          </div>
          <div>
            <Label htmlFor="b-seodesc">SEO description</Label>
            <Textarea id="b-seodesc" rows={2} maxLength={300} {...register('seoDescription')} />
          </div>
          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2.5 text-sm">
              <Checkbox checked={watch('featured')} onCheckedChange={(v) => setValue('featured', v, { shouldValidate: true })} />
              Featured
            </label>
            <label className="flex items-center gap-2.5 text-sm">
              <Checkbox checked={watch('published')} onCheckedChange={(v) => setValue('published', v, { shouldValidate: true })} />
              Published
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
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
      <div className="flex flex-wrap gap-2" role="group" aria-label="Add a content block">
        {[['heading', 'Heading'], ['paragraph', 'Paragraph'], ['list', 'List'], ['image', 'Image (URL)'], ['quote', 'Quote']].map(
          ([type, label]) => (
            <Button key={type} type="button" variant="outline" size="sm" onClick={() => addBlock(type)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {label}
            </Button>
          )
        )}
      </div>

      {!fields.length && (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No content blocks yet — add a heading or paragraph to start writing.
        </p>
      )}

      {typeof errors.content?.message === 'string' && (
        <p className="text-xs text-destructive">{errors.content.message}</p>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="rounded-xl border border-border p-4">
          <input type="hidden" {...register(`content.${index}.type`)} />
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              {index + 1}. {BLOCK_LABELS[field.type] || field.type}
            </span>
            <div className="flex items-center gap-1">
              <IconBtn label={`Move block ${index + 1} up`} disabled={index === 0} onClick={() => move(index, index - 1)}>
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </IconBtn>
              <IconBtn label={`Move block ${index + 1} down`} disabled={index === fields.length - 1} onClick={() => move(index, index + 1)}>
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </IconBtn>
              <IconBtn label={`Remove block ${index + 1}`} danger onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </IconBtn>
            </div>
          </div>

          {field.type === 'heading' && (
            <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
              <div>
                <Label htmlFor={`c-${index}-level`}>Level</Label>
                <Select id={`c-${index}-level`} className="mt-1.5" {...register(`content.${index}.level`)}>
                  <option value="2">H2</option>
                  <option value="3">H3</option>
                  <option value="4">H4</option>
                </Select>
              </div>
              <div>
                <Label htmlFor={`c-${index}-text`}>Heading text *</Label>
                <Input id={`c-${index}-text`} className="mt-1.5" {...register(`content.${index}.text`)} />
                {errors.content?.[index]?.text && (
                  <p className="mt-1 text-xs text-destructive">{errors.content[index].text.message}</p>
                )}
              </div>
            </div>
          )}

          {(field.type === 'paragraph' || field.type === 'quote') && (
            <div>
              <Label htmlFor={`c-${index}-text`}>
                {field.type === 'paragraph' ? 'Paragraph *' : 'Quote *'}
              </Label>
              <div className="mt-1.5">
                <RichTextEditor
                  value={watch ? watch(`content.${index}.text`) || '' : ''}
                  onChange={(html) => setValue && setValue(`content.${index}.text`, html, { shouldValidate: true, shouldDirty: true })}
                  placeholder={field.type === 'paragraph' ? 'Paragraph text…' : 'Quote text…'}
                  error={!!errors.content?.[index]?.text}
                />
              </div>
              {errors.content?.[index]?.text && (
                <p className="mt-1 text-xs text-destructive">{errors.content[index].text.message}</p>
              )}
            </div>
          )}

          {field.type === 'list' && <ListItems control={control} index={index} />}

          {field.type === 'image' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor={`c-${index}-url`}>Image URL *</Label>
                <Input id={`c-${index}-url`} type="url" className="mt-1.5" placeholder="https://…" {...register(`content.${index}.url`)} />
                {errors.content?.[index]?.url && (
                  <p className="mt-1 text-xs text-destructive">{errors.content[index].url.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor={`c-${index}-alt`}>Alt text</Label>
                <Input id={`c-${index}-alt`} className="mt-1.5" {...register(`content.${index}.alt`)} />
              </div>
              <div>
                <Label htmlFor={`c-${index}-caption`}>Caption</Label>
                <Input id={`c-${index}-caption`} className="mt-1.5" {...register(`content.${index}.caption`)} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
