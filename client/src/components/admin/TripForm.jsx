import * as React from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { tripSchema, TRIP_TYPES, TRIP_TYPE_LABELS, tripFormDefault } from '@/schemas/trip'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { ListItemEditor } from '@/components/trips/ListItemEditor'
import { FaqListEditor } from '@/components/trips/FaqListEditor'
import { TripItineraryBuilder } from '@/components/trips/TripItineraryBuilder'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import httpClient from '@/services/http'

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
const TRIP_TABS = [
  { id: 'basic', label: 'Basic' },
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'media', label: 'Media' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'content', label: 'FAQs' },
  { id: 'publish', label: 'Publish' },
]

function DeparturesEditor({ dates, disabled, error, onChange }) {
  const [draft, setDraft] = React.useState('')
  function add() {
    if (!draft) return
    if (dates.includes(draft)) { setDraft(''); return }
    onChange([...dates, draft].sort())
    setDraft('')
  }
  function updateAt(index, value) {
    const next = [...dates]; next[index] = value; onChange(next.filter(Boolean).sort())
  }
  function removeAt(index) { onChange(dates.filter((_, i) => i !== index)) }
  return (
    <div className={disabled ? 'pointer-events-none opacity-50' : undefined} aria-disabled={disabled}>
      {dates.length > 0 ? (
        <ul className="space-y-2">
          {dates.map((d, i) => (
            <li key={`${d}-${i}`} className="flex items-center gap-2">
              <Input type="date" value={d} onChange={(e) => updateAt(i, e.target.value)} className="h-8 max-w-[200px] text-sm" />
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAt(i)} aria-label={`Remove departure ${d}`}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (<p className="text-sm text-muted-foreground">No departure dates yet.</p>)}
      <div className="mt-3 flex items-center gap-2">
        <Input type="date" value={draft} onChange={(e) => setDraft(e.target.value)} className="h-8 max-w-[200px] text-sm" aria-label="New departure date" />
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={!draft} className="h-8 text-xs"><Plus className="h-4 w-4" />Add date</Button>
      </div>
      <FieldError message={error} />
    </div>
  )
}
function CostingEditor({ rows, error, onChange }) {
  const list = Array.isArray(rows) ? rows : []
  function updateAt(index, patch) { onChange(list.map((r, i) => (i === index ? { ...r, ...patch } : r))) }
  function removeAt(index) { onChange(list.filter((_, i) => i !== index)) }
  function add() { onChange([...list, { mode: '', price: null, originalPrice: null }]) }
  return (
    <div>
      {list.length > 0 ? (
        <ul className="space-y-3">
          {list.map((row, i) => (
            <li key={i} className="grid items-end gap-2 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-[1fr_140px_140px_auto]">
              <div><Label className="text-xs font-semibold">Room Sharing / Mode</Label><Input value={row.mode || ''} onChange={(e) => updateAt(i, { mode: e.target.value })} placeholder="e.g. Quad sharing" className="mt-1 h-8 text-sm" /></div>
              <div><Label className="text-xs font-semibold">Selling Price (₹)</Label><Input type="number" min={0} value={row.price ?? ''} onChange={(e) => updateAt(i, { price: e.target.value === '' ? null : Number(e.target.value) })} placeholder="8000" className="mt-1 h-8 text-sm" /></div>
              <div><Label className="text-xs font-semibold">Original Price (₹)</Label><Input type="number" min={0} value={row.originalPrice ?? ''} onChange={(e) => updateAt(i, { originalPrice: e.target.value === '' ? null : Number(e.target.value) })} placeholder="8500" className="mt-1 h-8 text-sm" /></div>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAt(i)} aria-label={`Remove costing row ${row.mode || i + 1}`}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      ) : (<p className="text-sm text-muted-foreground">No costing rows yet.</p>)}
      <Button type="button" variant="outline" size="sm" onClick={add} className="mt-3 h-8 text-xs"><Plus className="h-4 w-4" />Add Costing Row</Button>
      <FieldError message={error} />
    </div>
  )
}
function ThingsToCarryEditor({ items, error, onChange }) {
  const list = Array.isArray(items) ? items : []
  function updateAt(index, patch) { onChange(list.map((r, i) => (i === index ? { ...r, ...patch } : r))) }
  function removeAt(index) { onChange(list.filter((_, i) => i !== index)) }
  function add() { onChange([...list, { icon: '', name: '' }]) }
  return (
    <div>
      {list.length > 0 ? (
        <ul className="space-y-2">
          {list.map((row, i) => (
            <li key={i} className="flex items-end gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <div className="w-20 shrink-0"><Label className="text-xs font-semibold">Icon</Label><Input value={row.icon || ''} onChange={(e) => updateAt(i, { icon: e.target.value })} placeholder="" className="mt-1 h-8 text-center text-lg" maxLength={4} /></div>
              <div className="flex-1"><Label className="text-xs font-semibold">Item</Label><Input value={row.name || ''} onChange={(e) => updateAt(i, { name: e.target.value })} placeholder="e.g. Shoes" className="mt-1 h-8 text-sm" /></div>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => removeAt(i)} aria-label={`Remove item ${row.name || i + 1}`}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      ) : (<p className="text-sm text-muted-foreground">No items added yet.</p>)}
      <Button type="button" variant="outline" size="sm" onClick={add} className="mt-3 h-8 text-xs"><Plus className="h-4 w-4" />Add Item</Button>
      <FieldError message={error} />
    </div>
  )
}
function TripGalleryManager({ tripId }) {
  const queryClient = useQueryClient()
  const [videoUploading, setVideoUploading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const videoInputRef = React.useRef(null)
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'trip-gallery', tripId], queryFn: async () => { const { data } = await httpClient.get('/admin/media', { params: { tripId, limit: 50 } }); return data.data }, enabled: !!tripId })
  const items = data?.items || []
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'trip-gallery', tripId] })
  const fail = (e, fallback) => setError(e.response?.data?.message || e.message || fallback)
  async function createRecord(mediaType, meta) { setError(null); await httpClient.post('/admin/media', { tripId, mediaType, publicId: meta.publicId || '', secureUrl: meta.secureUrl || '', url: meta.url || '', width: meta.width ?? null, height: meta.height ?? null, format: meta.format || '', bytes: meta.bytes ?? null, altText: meta.alt || '', published: true }); invalidate() }
  async function handlePhotoUploaded(meta) { try { await createRecord('photo', meta) } catch (e) { fail(e, 'Photo upload failed') } }
  async function handleVideoFile(file) {
    if (!file) return; setError(null); setVideoUploading(true);
    try { const form = new FormData(); form.append('video', file); const { data } = await httpClient.post('/admin/upload/video?folder=traveler-media', form, { headers: { 'Content-Type': 'multipart/form-data' } }); await createRecord('video', data.data) } catch (e) { fail(e, 'Video upload failed') } finally { setVideoUploading(false) }
  }
  async function togglePublish(item) { try { await httpClient.patch(`/admin/media/${item.id}`, { published: !item.published }); invalidate() } catch (e) { fail(e, 'Update failed') } }
  async function removeItem(item) { try { await httpClient.delete(`/admin/media/${item.id}`); invalidate() } catch (e) { fail(e, 'Delete failed') } }
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label className="text-xs font-semibold">Upload photos</Label><div className="mt-1"><ImageUploader value={[]} onChange={() => {}} multiple folder="traveler-media" onUploaded={handlePhotoUploaded} /></div></div>
        <div><Label className="text-xs font-semibold">Upload video</Label><div className="mt-1"><Button type="button" variant="outline" size="sm" disabled={videoUploading} onClick={() => videoInputRef.current?.click()} className="h-8 text-xs">{videoUploading ? 'Uploading video…' : 'Upload video'}</Button><p className="mt-1 text-xs text-slate-500">MP4 or WebM — max 100 MB</p><input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { handleVideoFile(e.target.files?.[0]); e.target.value = '' }} /></div></div>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <div className="mt-4">
        {isLoading ? (<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />))}</div>) : items.length === 0 ? (<p className="text-sm text-muted-foreground">No gallery items yet. Upload photos or a video above.</p>) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((m) => (
              <div key={m.id} className="overflow-hidden rounded-lg border border-border bg-muted">
                {m.mediaType === 'video' ? (<div className="flex h-24 items-center justify-center bg-black text-xs font-medium text-white">Video</div>) : (<img src={m.secureUrl || m.url} alt={m.altText || ''} loading="lazy" className="h-24 w-full object-cover" />)}
                <div className="flex items-center justify-between gap-1 bg-white p-1.5"><span className="text-xs text-muted-foreground">{m.mediaType === 'video' ? 'Video' : 'Photo'} · {m.published ? 'Published' : 'Draft'}</span><span className="flex gap-1"><Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => togglePublish(m)}>{m.published ? 'Unpublish' : 'Publish'}</Button><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(m)} aria-label="Delete gallery item"><Trash2 className="h-4 w-4" /></Button></span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
export function TripForm({ initialValues, destinations, tripCode, tripId, isSubmitting, submitLabel, onSubmit }) {
  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors, isDirty }, trigger } = useForm({ mode: 'onChange', resolver: zodResolver(tripSchema), defaultValues: initialValues || tripFormDefault })
  const [activeTab, setActiveTab] = React.useState('basic')
  React.useEffect(() => { if (initialValues) reset(initialValues) }, [initialValues, reset])
  const featured = watch('featured'); const published = watch('published')
  const tabOrder = TRIP_TABS.map(t=>t.id)
  const currentIndex = tabOrder.indexOf(activeTab)
  const goNext = async () => {
    const fieldsByTab = {
      basic: ['destinationId','cardName','pageHeading','slug','tripType','durationDays','durationNights','maxGroupSize','shortDescription','description'],
      itinerary: ['itinerary','inclusions','exclusions','importantInformation','thingsToCarry'],
      media: ['cardImage'],
      pricing: ['startingPrice','originalPrice','currency','datesOnRequest','departures','costing'],
      content: ['faqs'],
      publish: ['featured','published','displayOrder','seoTitle','seoDescription','seoKeywords']
    }
    const fields = fieldsByTab[activeTab] || []
    const valid = await trigger(fields)
    if (valid && currentIndex < tabOrder.length - 1) setActiveTab(tabOrder[currentIndex+1])
    if (!valid) setTimeout(()=>{ const el=document.querySelector('[aria-invalid="true"]'); if(el) el.scrollIntoView({behavior:'smooth',block:'center'}) },80)
  }
  const goPrev = () => { if (currentIndex>0) setActiveTab(tabOrder[currentIndex-1]) }
  const hasDirty = isDirty
  React.useEffect(()=>{ const h=(e)=>{ if(!hasDirty) return; e.preventDefault(); e.returnValue=''}; window.addEventListener('beforeunload',h); return()=>window.removeEventListener('beforeunload',h)},[hasDirty])
  const onInvalid = React.useCallback(()=>{ setTimeout(()=>{ const el=document.querySelector('[aria-invalid="true"]'); if(el) el.scrollIntoView({behavior:'smooth',block:'center'}) },80)},[])
  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="pb-10">
      <div className="sticky top-12 z-10 mb-4 -mx-4 border-y border-slate-200 bg-white px-4 sm:mx-0 sm:px-0">
        <div className="-mb-px flex gap-5 overflow-x-auto">
          {TRIP_TABS.map(t=>(
            <button key={t.id} type="button" onClick={()=>setActiveTab(t.id)} className={`shrink-0 border-b-2 px-1 py-2.5 text-xs font-semibold tracking-wide transition-colors ${activeTab===t.id?'border-slate-900 text-slate-900':'border-transparent text-slate-500 hover:text-slate-700'}`}>{t.label}</button>
          ))}
        </div>
      </div>
      <div className="w-full min-w-0 max-w-full bg-white overflow-hidden">
        {activeTab==='basic' && (
          <div className="space-y-0 divide-y divide-slate-200 border border-slate-200 bg-white min-w-0 max-w-full overflow-hidden">
            <div className="p-4"><RecordSection title="Basic Information"><div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-4">
              <DenseField label="Destination" required error={errors.destinationId?.message}><Select {...register('destinationId')} defaultValue=""><option value="">Select a destination</option>{destinations.map(d=>(<option key={d.id} value={d.id}>{d.name}</option>))}</Select></DenseField>
              <DenseField label="Trip type" required error={errors.tripType?.message} hint="Select one or more types"><div className="grid grid-cols-1 gap-2 rounded-md border border-input p-3 sm:grid-cols-2">{TRIP_TYPES.filter((t) => t !== 'match_maker').map((t) => { const selected = Array.isArray(watch('tripType')) ? watch('tripType').includes(t) : false; return (<label key={t} className="flex items-center gap-2 text-sm"><Checkbox checked={selected} onCheckedChange={(checked) => { const curr = Array.isArray(watch('tripType')) ? watch('tripType') : []; const next = checked ? [...curr, t] : curr.filter((v) => v !== t); setValue('tripType', next, { shouldValidate: true, shouldDirty: true }); }} />{TRIP_TYPE_LABELS[t]}</label>); })}</div></DenseField>
              <DenseField label="Trip Card Name" required error={errors.cardName?.message} hint="Short name shown on trip cards only. Enter independently — never auto-copied."><Input placeholder="e.g. 8 Days Sri Lanka Trip in December" {...register('cardName')} className="h-8 text-sm" /></DenseField>
              <DenseField label="Trip Page Heading" error={errors.pageHeading?.message} hint="Heading shown in the trip detail page below the hero. Enter independently."><Input placeholder="e.g. Days Sri Lanka Trip in December" {...register('pageHeading')} className="h-8 text-sm" /></DenseField>
              <DenseField label="Slug" error={errors.slug?.message} hint="URL-safe. Auto-generated from the Trip Card Name if left blank."><Input placeholder="vietnam-8-days" aria-invalid={!!errors.slug} {...register('slug')} className="h-8 text-sm" /></DenseField>
              {tripCode && (<DenseField label="Trip code" hint="Generated server-side and not editable."><Input value={tripCode} readOnly disabled className="h-8 text-sm" /></DenseField>)}
              <DenseField label="Duration Days" required error={errors.durationDays?.message}><Input type="number" min={1} placeholder="8" {...register('durationDays')} className="h-8 text-sm" /></DenseField>
              <DenseField label="Duration Nights" required error={errors.durationNights?.message}><Input type="number" min={0} placeholder="7" {...register('durationNights')} className="h-8 text-sm" /></DenseField>
              <DenseField label="Max Group Size" required error={errors.maxGroupSize?.message}><Input type="number" min={1} placeholder="10" {...register('maxGroupSize')} className="h-8 text-sm" /></DenseField>
              <DenseField label="Short Description" error={errors.shortDescription?.message}><Textarea rows={2} placeholder="Short description for listings" {...register('shortDescription')} className="text-sm" /></DenseField>
            </div><div className="mt-4"><DenseField label="Description" required error={errors.description?.message}><RichTextEditor value={watch('description')||''} onChange={(html)=>setValue('description',html,{shouldValidate:true,shouldDirty:true})} placeholder="Full description of the trip" error={!!errors.description} /></DenseField></div></RecordSection></div>
          </div>
        )}
        {activeTab==='itinerary' && (
          <div className="space-y-0 divide-y divide-slate-200 border border-slate-200 bg-white">
            <div className="p-4"><RecordSection title="Itinerary"><TripItineraryBuilder control={control} register={register} watch={watch} setValue={setValue} errors={errors} /></RecordSection></div>
            <div className="p-4"><RecordSection title="Inclusions"><ListItemEditor control={control} name="inclusions" label="Inclusions" placeholder="e.g. Airport transfers" /></RecordSection></div>
            <div className="p-4"><RecordSection title="Exclusions"><ListItemEditor control={control} name="exclusions" label="Exclusions" placeholder="e.g. International flights" /></RecordSection></div>
            <div className="p-4"><RecordSection title="Important Information"><DenseField label="Travel information" error={errors.importantInformation?.message} hint="Visa, passport, cancellation, fitness, luggage, weather…"><RichTextEditor value={watch('importantInformation')||''} onChange={(html)=>setValue('importantInformation',html,{shouldValidate:true,shouldDirty:true})} placeholder="Important details travellers should know" error={!!errors.importantInformation} /></DenseField></RecordSection></div>
            <div className="p-4"><RecordSection title="Things to Carry"><ThingsToCarryEditor items={watch('thingsToCarry')||[]} error={errors.thingsToCarry?.message} onChange={(next)=> setValue('thingsToCarry', next, { shouldValidate: true, shouldDirty: true })} /></RecordSection></div>
          </div>
        )}
        {activeTab==='media' && (
          <div className="space-y-0 divide-y divide-slate-200 border border-slate-200 bg-white">
            <div className="p-4"><RecordSection title="Trip Card Image"><div className="space-y-1"><Label className="text-xs font-semibold">Image shown on trip cards across the website.</Label><div className="mt-1.5"><ImageUploader value={watch('cardImage')} onChange={(v)=> setValue('cardImage', {...(watch('cardImage')||{}), ...v, alt: v.alt || watch('cardImage.alt')}, {shouldValidate:true, shouldDirty:true})} folder="trip-media" /></div><div className="mt-2"><Input placeholder="Alt text" {...register('cardImage.alt')} className="h-8 text-sm" /></div></div></RecordSection></div>
            <div className="p-4"><RecordSection title="Gallery"><TripGalleryManager tripId={tripId} /></RecordSection></div>
          </div>
        )}
        {activeTab==='pricing' && (
          <div className="space-y-0 divide-y divide-slate-200 border border-slate-200 bg-white">
            <div className="p-4"><RecordSection title="Pricing"><div className="grid gap-3 sm:grid-cols-3"><DenseField label="Starting price" required error={errors.startingPrice?.message} hint="Base package price only. Departure-specific pricing comes later."><Input type="number" min={0} placeholder="51999" {...register('startingPrice')} className="h-8 text-sm" /></DenseField><DenseField label="Original price (MRP)" error={errors.originalPrice?.message} hint="Optional. When above the starting price, the card shows it struck through with the derived discount."><Input type="number" min={0} placeholder="59999" {...register('originalPrice')} className="h-8 text-sm" /></DenseField><DenseField label="Currency" required error={errors.currency?.message}><Input placeholder="INR" {...register('currency')} className="h-8 text-sm" /></DenseField></div></RecordSection></div>
            <div className="p-4"><RecordSection title="Departures"><div className="space-y-4"><label className="flex items-center gap-2.5 text-sm"><Checkbox checked={!!watch('datesOnRequest')} onCheckedChange={(v)=> setValue('datesOnRequest', v, { shouldValidate: true, shouldDirty: true })} /><span>All dates available<span className="ml-1 text-xs text-muted-foreground">(card shows exactly “All dates available”, no dates required)</span></span></label><DeparturesEditor dates={watch('departures')||[]} disabled={!!watch('datesOnRequest')} error={errors.departures?.message} onChange={(next)=> setValue('departures', next, { shouldValidate: true, shouldDirty: true })} /></div></RecordSection></div>
            <div className="p-4"><RecordSection title="Costing"><CostingEditor rows={watch('costing')||[]} error={errors.costing?.message} onChange={(next)=> setValue('costing', next, { shouldValidate: true, shouldDirty: true })} /></RecordSection></div>
          </div>
        )}
        {activeTab==='content' && (
          <div className="space-y-0 divide-y divide-slate-200 border border-slate-200 bg-white">
            <div className="p-4"><RecordSection title="FAQs"><FaqListEditor control={control} /></RecordSection></div>
          </div>
        )}
        {activeTab==='publish' && (
          <div className="space-y-0 divide-y divide-slate-200 border border-slate-200 bg-white">
            <div className="p-4"><RecordSection title="Discovery"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><label className="flex items-center gap-2.5 text-sm"><Checkbox checked={featured} onCheckedChange={(v)=> setValue('featured', v, { shouldValidate: true })} /><span>Featured<span className="ml-1 text-xs text-muted-foreground">(highlight on listings)</span></span></label><div className="w-full sm:max-w-[200px]"><DenseField label="Display order" error={errors.displayOrder?.message}><Input type="number" min={0} {...register('displayOrder')} className="h-8 text-sm" /></DenseField></div></div></RecordSection></div>
            <div className="p-4"><RecordSection title="SEO"><div className="space-y-3"><DenseField label="SEO title" error={errors.seoTitle?.message}><div><Input placeholder="Vietnam 8 Days Tour Package" {...register('seoTitle')} className="h-8 text-sm" maxLength={60} /><p className="mt-1 text-right text-xs text-slate-500">{(watch('seoTitle')||'').length} / 60</p></div></DenseField><DenseField label="SEO description" error={errors.seoDescription?.message}><div><Textarea rows={2} {...register('seoDescription')} className="text-sm" maxLength={160} /><p className="mt-1 text-right text-xs text-slate-500">{(watch('seoDescription')||'').length} / 160</p></div></DenseField><DenseField label="SEO keywords" error={errors.seoKeywords?.message}><Input placeholder="vietnam, hanoi, ho chi minh" {...register('seoKeywords')} className="h-8 text-sm" /></DenseField></div></RecordSection></div>
            <div className="p-4"><RecordSection title="Publishing"><label className="flex items-center gap-2.5 text-sm"><Checkbox checked={published} onCheckedChange={(v)=> setValue('published', v, { shouldValidate: true })} /><span>Published<span className="ml-1 text-xs text-muted-foreground">(visible on the public site)</span></span></label></RecordSection></div>
          </div>
        )}
      </div>
      <div className="sticky bottom-0 z-20 mt-6 flex items-center justify-between gap-3 border bg-white px-3 py-2 shadow-sm">
        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={goPrev} disabled={currentIndex===0}>Back</Button>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-slate-500 sm:inline">Step {currentIndex+1} of {TRIP_TABS.length}</span>
          {currentIndex < TRIP_TABS.length -1 ? (
            <Button type="button" size="sm" className="h-8 bg-slate-900 text-white hover:bg-slate-800 text-xs" onClick={goNext}>Next</Button>
          ) : (
            <Button type="submit" size="sm" disabled={isSubmitting} className="h-8 bg-slate-900 text-white hover:bg-slate-800 text-xs">
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {isSubmitting ? 'Saving…' : submitLabel}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
