import Notification from '../models/Notification.js'

function notFound(msg='Not found'){ const e=new Error(msg); e.status=404; return e }

// fire-and-forget creation guarded so callers never break on notify errors
async function create({ userId, type, title, message, relatedEntityType=null, relatedEntityId=null, eventKey='' }) {
  if (!userId) return null
  try {
    // eventKey (when set) makes events idempotent — same user+event won't duplicate
    const filter = eventKey ? { userId, eventKey } : { userId, type, relatedEntityId, title, message }
    const existing = eventKey ? await Notification.findOne(filter).lean() : null
    if (existing) return existing
    return Notification.create({ userId, type, title, message, relatedEntityType, relatedEntityId, eventKey: eventKey || undefined })
  } catch (e) {
    if (e?.code === 11000) return Notification.findOne({ userId, eventKey }).lean().catch(() => null)
    console.error('[notification] create failed', e?.message)
    return null
  }
}

function fmtDate(iso){ return iso ? new Date(iso).toISOString().slice(0,10) : '' }

export async function createBookingNotification(userId, { event, booking, tripName, departureDate }) {
  const map = {
    created: { type:'booking_created', title:'Booking received', message:`Your booking for ${tripName||'your trip'} is confirmed pending payment.` },
    confirmed: { type:'booking_confirmed', title:'Booking confirmed', message:`Your booking for ${tripName||'your trip'} has been confirmed.` },
    cancelled: { type:'booking_cancelled', title:'Booking cancelled', message:`Your booking for ${tripName||'your trip'} was cancelled.` },
  }
  const tpl = map[event] || { type:'booking_status_changed', title:'Booking updated', message:`Your booking for ${tripName||'your trip'} was updated.` }
  return create({
    userId, type: tpl.type, title: tpl.title, message: tpl.message,
    relatedEntityType:'booking', relatedEntityId: booking?.id || booking?._id || null,
    eventKey: booking?._id ? `booking:${booking._id}:${tpl.type}` : ''
  })
}

export async function createTripNotification(userId, { event, batch, tripName, departureDate }) {
  const map = {
    departure_changed: { type:'trip_departure_changed', title:'Departure date changed', message:`The departure for ${tripName||'your trip'} has changed to ${fmtDate(departureDate)||'a new date'}.` },
    batch_cancelled: { type:'trip_batch_cancelled', title:'Departure cancelled', message:`The departure for ${tripName||'your trip'} on ${fmtDate(departureDate)||'your date'} has been cancelled.` },
  }
  const tpl = map[event] || { type:'trip_batch_changed', title:'Departure updated', message:`There is an important update to your ${tripName||'trip'} departure.` }
  return create({
    userId, type: tpl.type, title: tpl.title, message: tpl.message,
    relatedEntityType:'trip_batch', relatedEntityId: batch?._id || null,
    eventKey: batch?._id ? `batch:${batch._id}:${tpl.type}` : ''
  })
}

export async function createReviewNotification(userId, { event, review, tripName }) {
  const map = {
    submitted: { type:'review_submitted', title:'Review submitted', message:`Thanks! Your review for ${tripName||'your trip'} is awaiting moderation.` },
    approved: { type:'review_approved', title:'Review approved', message:`Your review for ${tripName||'your trip'} is now public.` },
    rejected: { type:'review_rejected', title:'Review not approved', message:`Your review for ${tripName||'your trip'} was not approved.` },
  }
  const tpl = map[event]
  if(!tpl) return null
  return create({
    userId, type: tpl.type, title: tpl.title, message: tpl.message,
    relatedEntityType:'review', relatedEntityId: review?._id || null,
    eventKey: review?._id ? `review:${review._id}:${tpl.type}` : ''
  })
}

export async function getUserNotifications(userId, { page=1, limit=10 }={}) {
  const total = await Notification.countDocuments({ userId })
  const totalPages = Math.max(1, Math.ceil(total/limit))
  const safePage = Math.min(page, totalPages)
  const items = await Notification.find({ userId }).sort({ createdAt:-1 }).skip((safePage-1)*limit).limit(limit).lean()
  const unreadCount = await Notification.countDocuments({ userId, readAt: null })
  return { items: items.map(n=>({...n, id:n._id.toString()})), unreadCount, page:safePage, limit, total, totalPages }
}

export async function getUnreadCount(userId) {
  return Notification.countDocuments({ userId, readAt: null })
}

export async function markAsRead(userId, id) {
  const doc = await Notification.findOneAndUpdate({ _id:id, userId }, { readAt: new Date() }, { new:true }).lean()
  if(!doc) throw notFound('Notification not found')
  return { ...doc, id: doc._id.toString() }
}

export async function markAllAsRead(userId) {
  const r = await Notification.updateMany({ userId, readAt: null }, { readAt: new Date() })
  return { updated: r.modifiedCount }
}

export async function remove(userId, id) {
  const doc = await Notification.findOneAndDelete({ _id:id, userId }).lean()
  if(!doc) throw notFound('Notification not found')
  return { id: doc._id.toString() }
}
