import * as notif from '../services/notification.service.js'

export async function list(req,res,next){ try{
  const data = await notif.getUserNotifications(req.userId, req.query)
  res.json({ success:true, data })
}catch(e){next(e)} }

export async function unreadCount(req,res,next){ try{
  const count = await notif.getUnreadCount(req.userId)
  res.json({ success:true, data:{ unreadCount: count } })
}catch(e){next(e)} }

export async function markRead(req,res,next){ try{
  const doc = await notif.markAsRead(req.userId, req.params.id)
  res.json({ success:true, data: doc })
}catch(e){next(e)} }

export async function markAll(req,res,next){ try{
  const r = await notif.markAllAsRead(req.userId)
  res.json({ success:true, data: r })
}catch(e){next(e)} }

export async function remove(req,res,next){ try{
  const r = await notif.remove(req.userId, req.params.id)
  res.json({ success:true, data: r })
}catch(e){next(e)} }
