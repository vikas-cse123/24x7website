import * as React from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import httpClient from '@/services/http'

// Tracks the uploader the user interacted with last, so paste goes to the
// right instance when several uploaders exist on the same page/form.
let activeUploaderEl = null
const mountedUploaders = new Set()

export function ImageUploader({
  value, // {url, secureUrl, publicId, alt} or array
  onChange,
  multiple = false,
  folder = 'website',
  entityId,
  maxFiles = 10,
  className,
  onUploaded, // optional: called with each successfully uploaded media object
}) {
  const isArray = Array.isArray(value)
  const [dragOver, setDragOver] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(null)
  const [error, setError] = React.useState(null)
  const inputRef = React.useRef(null)
  const containerRef = React.useRef(null)
  const uploadRef = React.useRef(null)

  const upload = async (files) => {
    if (!files.length) return
    setError(null); setUploading(true); setProgress(0)
    try {
      const form = new FormData()
      const params = new URLSearchParams({ folder, ...(entityId ? { id: entityId } : {}) })
      if (files.length === 1 && !multiple) {
        form.append('image', files[0])
        const { data } = await httpClient.post(`/admin/upload/single?${params}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: e => setProgress(Math.round((e.loaded*100)/(e.total||1))),
        })
        onChange(data.data)
        onUploaded?.(data.data)
      } else {
        files.slice(0, maxFiles).forEach(f => form.append('images', f))
        const { data } = await httpClient.post(`/admin/upload/many?${params}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        const arr = Array.isArray(data.data) ? data.data : [data.data]
        if (isArray) onChange([...value, ...arr].slice(0, maxFiles))
        else onChange(arr[0])
        arr.forEach(item => onUploaded?.(item))
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Upload failed')
    } finally { setUploading(false); setProgress(null) }
  }
  uploadRef.current = upload

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    upload(Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith('image/')))
  }

  React.useEffect(() => {
    const el = containerRef.current
    mountedUploaders.add(el)
    const onPaste = (e) => {
      const target = (activeUploaderEl?.isConnected && activeUploaderEl) ||
        [...mountedUploaders].find(x => x?.isConnected)
      if (!el || !el.isConnected || target !== el) return
      const files = Array.from(e.clipboardData?.files || []).filter(f => f.type.startsWith('image/'))
      if (!files.length) return
      e.preventDefault()
      uploadRef.current(files)
    }
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('paste', onPaste)
      mountedUploaders.delete(el)
      if (activeUploaderEl === el) activeUploaderEl = null
    }
  }, [])

  const markActive = () => { activeUploaderEl = containerRef.current }
  const markInactive = () => {
    if (activeUploaderEl === containerRef.current) activeUploaderEl = null
  }

  const remove = (idx) => {
    if (isArray) {
      const next=[...value]; next.splice(idx,1); onChange(next)
    } else onChange({ url:'', secureUrl:'', publicId:'', alt: value?.alt||'' })
  }

  const move = (from,to) => {
    if (!isArray) return
    const next=[...value]; const [m]=next.splice(from,1); next.splice(to,0,m); onChange(next)
  }

  const items = isArray ? value : value ? [value] : []
  const hasImage = items.some(i=>i?.secureUrl||i?.url)

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={containerRef}
        tabIndex={0}
        onPointerDown={markActive}
        onPointerEnter={markActive}
        onPointerLeave={markInactive}
        onFocus={markActive}
        onDragOver={e=>{e.preventDefault(); setDragOver(true)}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={onDrop}
        onClick={()=>inputRef.current?.click()}
        className={cn("flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          uploading && "pointer-events-none opacity-60")}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple={multiple} className="hidden"
          onChange={e=>upload(Array.from(e.target.files||[]))} />
        {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
        <p className="mt-2 text-sm font-medium">{dragOver ? "Drop images here" : "Click, drag & drop, or paste images"}</p>
        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — max 10 MB — or press Ctrl/Cmd+V after clicking here</p>
        {progress!=null && <p className="mt-1 text-xs text-primary">{progress}%</p>}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {isArray ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((img, i) => (
            <div key={i} className="group relative overflow-hidden rounded-lg border border-border bg-muted">
              {img?.secureUrl||img?.url ? (
                <img src={img.secureUrl||img.url} alt={img.alt||`image ${i+1}`} className="h-32 w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-32 items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground/40" /></div>
              )}
              <div className="absolute inset-0 flex items-start justify-between bg-gradient-to-b from-black/40 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">{img.publicId ? 'S3' : hasImage ? 'External' : ''}</span>
                <Button type="button" size="icon" variant="destructive" className="h-7 w-7" onClick={e=>{e.stopPropagation(); remove(i)}}><X className="h-4 w-4" /></Button>
              </div>
              {isArray && (
                <div className="flex gap-1 p-1">
                  <Button type="button" variant="ghost" size="sm" disabled={i===0} onClick={()=>move(i,i-1)} className="h-7 flex-1">↑</Button>
                  <Button type="button" variant="ghost" size="sm" disabled={i===items.length-1} onClick={()=>move(i,i+1)} className="h-7 flex-1">↓</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : hasImage && (
        <div className="relative overflow-hidden rounded-lg border border-border">
          <img src={items[0].secureUrl||items[0].url} alt={items[0].alt||'preview'} className="max-h-96 w-full object-contain" />
          <Button type="button" size="icon" variant="destructive" className="absolute right-2 top-2 h-7 w-7" onClick={()=>remove(0)}><X className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  )
}
