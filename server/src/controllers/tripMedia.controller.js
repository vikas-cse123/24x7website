import * as service from '../services/tripMedia.service.js'

export async function listPublic(req,res,next){
  try{
    const items=await service.listPublic(req.params.tripId, req.query)
    res.json({ success:true, data: items })
  }catch(e){ next(e) }
}
export async function listAdmin(req,res,next){
  try{
    const data=await service.listAdmin(req.query)
    res.json({ success:true, data })
  }catch(e){ next(e) }
}
export async function create(req,res,next){
  try{
    const doc=await service.create(req.body, req.userId)
    res.status(201).json({ success:true, data: doc })
  }catch(e){ next(e) }
}
export async function update(req,res,next){
  try{
    const doc=await service.update(req.params.id, req.body)
    res.json({ success:true, data: doc })
  }catch(e){ next(e) }
}
export async function remove(req,res,next){
  try{
    const r=await service.remove(req.params.id)
    res.json({ success:true, data: r })
  }catch(e){ next(e) }
}
export async function setPublished(req,res,next){
  try{
    const doc=await service.setPublished(req.params.id, req.body.published)
    res.json({ success:true, data: doc })
  }catch(e){ next(e) }
}
export async function reorder(req,res,next){
  try{
    const r=await service.reorder(req.body.tripId, req.body.orderedIds)
    res.json({ success:true, data: r })
  }catch(e){ next(e) }
}
