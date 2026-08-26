import Wishlist from '../models/Wishlist.js'
import Trip from '../models/Trip.js'
import Destination from '../models/Destination.js'

function badRequest(msg){ const e=new Error(msg); e.status=400; return e }
function notFound(msg='Not found'){ const e=new Error(msg); e.status=404; return e }
function conflict(msg){ const e=new Error(msg); e.status=409; return e }

async function ensureExists(type, id){
  if(type==='trip'){
    const doc = await Trip.findById(id).select('_id').lean()
    if(!doc) throw notFound('Trip not found')
  } else {
    const doc = await Destination.findById(id).select('_id').lean()
    if(!doc) throw notFound('Destination not found')
  }
}

export async function create(userId, { type, id }){
  await ensureExists(type, id)
  try {
    const doc = await Wishlist.create({ userId, itemType: type, itemId: id })
    return doc.toJSON()
  } catch(e){
    if(e.code===11000) throw conflict('Already in wishlist')
    throw e
  }
}

export async function list(userId){
  const items = await Wishlist.find({ userId }).sort({ createdAt: -1 }).lean()
  // Batch fetch to avoid N+1
  const tripIds = items.filter(i=>i.itemType==='trip').map(i=>i.itemId)
  const destIds = items.filter(i=>i.itemType==='destination').map(i=>i.itemId)
  const [trips, dests] = await Promise.all([
    tripIds.length ? Trip.find({_id:{$in:tripIds}}).populate('destinationId','name slug country').lean() : [],
    destIds.length ? Destination.find({_id:{$in:destIds}}).lean() : [],
  ])
  const tripMap = new Map(trips.map(t=> [t._id.toString(), t]))
  const destMap = new Map(dests.map(d=> [d._id.toString(), d]))
  // Build response, skip broken refs gracefully but include placeholder
  return items.map(it=>{
    const idStr = it.itemId.toString()
    if(it.itemType==='trip'){
      const t = tripMap.get(idStr)
      if(!t) return { ...it, id: it._id.toString(), item: null, unavailable: true }
      return { ...it, id: it._id.toString(), item: { id: t._id.toString(), name: t.name, slug: t.slug, heroImage: t.heroImage, destination: t.destinationId ? { name: t.destinationId.name, slug: t.destinationId.slug } : null, startingPrice: t.startingPrice, currency: t.currency, durationDays: t.durationDays, durationNights: t.durationNights, published: t.published } }
    } else {
      const d = destMap.get(idStr)
      if(!d) return { ...it, id: it._id.toString(), item: null, unavailable: true }
      return { ...it, id: it._id.toString(), item: { id: d._id.toString(), name: d.name, slug: d.slug, heroImage: d.heroImage, country: d.country, published: d.published } }
    }
  }).filter(Boolean)
}

export async function remove(userId, type, id){
  const doc = await Wishlist.findOneAndDelete({ userId, itemType: type, itemId: id })
  if(!doc) throw notFound('Wishlist item not found')
  return { deleted: true }
}
