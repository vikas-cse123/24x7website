import TripMedia from '../models/TripMedia.js'
import Trip from '../models/Trip.js'
import * as imageStorage from './imageStorage.service.js'

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
  const existing=await TripMedia.findById(id)
  if(!existing) throw notFound('Media not found')
  const keysBefore=imageStorage.collectKeys(existing.toObject())
  const doc=await TripMedia.findByIdAndUpdate(id, data, { new:true }).lean()
  // Delete the replaced S3 object. Reference-aware: skipped if still used elsewhere.
  const staleKeys=imageStorage.removedKeys(keysBefore, doc)
  await imageStorage.cleanupUnreferenced(staleKeys, `TripMedia ${id} update`)
  return { ...doc, id: doc._id.toString() }
}

export async function remove(id){
  const doc=await TripMedia.findByIdAndDelete(id).lean()
  if(!doc) throw notFound('Media not found')
  // Reference-aware S3 cleanup of the stored media object.
  await imageStorage.cleanupUnreferenced(imageStorage.collectKeys(doc), `TripMedia ${id} delete`)
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
