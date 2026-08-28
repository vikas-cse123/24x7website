import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Image as ImageIcon, Trash2, CheckCircle, XCircle, ArrowUp, ArrowDown } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import httpClient from '@/services/http'
import { adminTripApi } from '@/services/trips'
import { toast } from 'sonner'

function useMedia(tripId, mediaType, published){
  return useQuery({
    queryKey: ['admin','media', { tripId, mediaType, published }],
    queryFn: async () => {
      const params={}
      if(tripId) params.tripId=tripId
      if(mediaType) params.mediaType=mediaType
      if(published) params.published=published
      const { data } = await httpClient.get('/admin/media', { params })
      return data.data
    }
  })
}

export function AdminMediaPage(){
  const qc=useQueryClient()
  const [tripId, setTripId]=React.useState('')
  const [mediaType, setMediaType]=React.useState('')
  const [published, setPublished]=React.useState('')
  const [createTripId, setCreateTripId]=React.useState('')
  const [altText, setAltText]=React.useState('')
  const [uploadData, setUploadData]=React.useState(null)

  const { data: tripsData } = useQuery({ queryKey:['admin','trips','list'], queryFn:()=>adminTripApi.list({ limit:100 }) })
  const trips = tripsData?.data?.data?.items || []

  const { data, isLoading } = useMedia(tripId, mediaType, published)
  const items = data?.items || []

  const createMut = useMutation({
    mutationFn: async () => {
      if(!createTripId) throw new Error('Select a trip')
      if(!uploadData?.publicId) throw new Error('Upload an image first')
      const payload = {
        tripId: createTripId,
        mediaType: 'photo',
        publicId: uploadData.publicId,
        secureUrl: uploadData.secureUrl,
        url: uploadData.url,
        width: uploadData.width,
        height: uploadData.height,
        format: uploadData.format,
        bytes: uploadData.bytes,
        altText,
        published: true,
      }
      const { data } = await httpClient.post('/admin/media', payload)
      return data
    },
    onSuccess: ()=>{ toast.success('Media added'); qc.invalidateQueries({queryKey:['admin','media']}); setUploadData(null); setAltText('') },
    onError: e=> toast.error(e.response?.data?.message || e.message)
  })

  const togglePublish = useMutation({
    mutationFn: ({id, published})=> httpClient.patch(`/admin/media/${id}`, { published }).then(r=>r.data),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','media']})
  })
  const delMut = useMutation({
    mutationFn: (id)=> httpClient.delete(`/admin/media/${id}`),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','media']})
  })

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Traveler Media</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage traveler photos/videos per trip. Only published media appears publicly.</p>

      <Card className="mt-6 p-4">
        <h3 className="font-medium text-sm">Add traveler photo</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Trip *</Label>
            <Select value={createTripId} onChange={e=>setCreateTripId(e.target.value)} className="mt-1.5">
              <option value="">Select trip</option>
              {trips.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Alt text</Label>
            <Input value={altText} onChange={e=>setAltText(e.target.value)} placeholder="Describe the photo" className="mt-1.5" />
          </div>
        </div>
        <div className="mt-3">
          <ImageUploader value={uploadData} onChange={setUploadData} folder="traveler-media" />
        </div>
        <Button onClick={()=>createMut.mutate()} disabled={createMut.isPending} className="mt-3">Add to gallery</Button>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <Select value={tripId} onChange={e=>setTripId(e.target.value)} className="h-9" aria-label="Filter by trip">
          <option value="">All trips</option>
          {trips.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
        <Select value={mediaType} onChange={e=>setMediaType(e.target.value)} className="h-9">
          <option value="">All types</option>
          <option value="photo">Photos</option>
          <option value="video">Videos</option>
        </Select>
        <Select value={published} onChange={e=>setPublished(e.target.value)} className="h-9">
          <option value="">All status</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </Select>
      </div>

      {isLoading ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{Array.from({length:6}).map((_,i)=><div key={i} className="h-32 animate-pulse rounded-xl bg-muted"/> )}</div>
      : items.length===0 ? <Card className="mt-6 p-10 text-center text-sm text-muted-foreground">No traveler media yet. Add photos above.</Card>
      : <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map(m=>(
            <Card key={m.id} className="overflow-hidden">
              <DestinationImage image={m} alt={m.altText} className="aspect-square w-full" width={400} />
              <div className="p-2 flex items-center justify-between">
                <Badge variant={m.published ? 'default' : 'secondary'}>{m.published ? 'Published' : 'Draft'}</Badge>
                <span className="text-xs text-muted-foreground">{m.mediaType}</span>
              </div>
              <div className="flex gap-1 p-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={()=>togglePublish.mutate({id:m.id, published: !m.published})}>{m.published ? <XCircle className="h-4 w-4"/> : <CheckCircle className="h-4 w-4"/>}{m.published?'Unpublish':'Publish'}</Button>
                <Button size="icon" variant="ghost" onClick={()=>delMut.mutate(m.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      }
    </div>
  )
}
