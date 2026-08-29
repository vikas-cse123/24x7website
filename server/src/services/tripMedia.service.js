import TripMedia from '../models/TripMedia.js'
import Trip from '../models/Trip.js'

function notFound(msg='Not found'){ const e=new Error(msg); e.status=404; return e }

export async function listPublic(tripId, { mediaType }={}){
  const trip = await Trip.findById(tripId).select('_id').lean()
  if(!trip) throw notFound('Trip not found')
  const filter={ tripId, published:true }
  if(mediaType) filter.mediaType=mediaType
  const items = await TripMedia.find(filter).sort({ displayOrder:1, createdAt:1 }).lean()
  return items.map(m=>({ ...m, id: m._id.toString() }))
}

export async function listAdmin({ tripId, mediaType, published, page=1, limit=20 }){
  const filter={}
  if(tripId) filter.tripId=tripId
  if(mediaType) filter.mediaType=mediaType
  if(published!==undefined) filter.published=published
  const total=await TripMedia.countDocuments(filter)
  const items=await TripMedia.find(filter).populate('tripId','name slug').sort({ displayOrder:1, createdAt:-1 }).skip((page-1)*limit).limit(limit).lean()
  return { items: items.map(m=>({...m, id:m._id.toString()})), total, page, limit, totalPages: Math.ceil(total/limit)||1 }
}

export async function create(data, userId){
  const trip=await Trip.findById(data.tripId).select('_id').lean()
  if(!trip) throw notFound('Trip not found')
  const doc=await TripMedia.create({ ...data, userId: userId||null })
  return doc.toObject()
}

export async function update(id, data){
  const doc=await TripMedia.findByIdAndUpdate(id, data, { new:true }).lean()
  if(!doc) throw notFound('Media not found')
  return { ...doc, id: doc._id.toString() }
}

export async function remove(id){
  const doc=await TripMedia.findByIdAndDelete(id).lean()
  if(!doc) throw notFound('Media not found')
  // Do NOT delete the stored S3 object automatically
  return { id: doc._id.toString() }
}

export async function setPublished(id, published){
  const doc=await TripMedia.findByIdAndUpdate(id, { published }, { new:true }).lean()
  if(!doc) throw notFound('Media not found')
  return { ...doc, id: doc._id.toString() }
}

export async function reorder(tripId, orderedIds){
  // orderedIds: array of media ids in desired order
  for(let i=0;i<orderedIds.length;i++){
    await TripMedia.updateOne({ _id: orderedIds[i], tripId }, { displayOrder: i })
  }
  return { updated: orderedIds.length }
}
