import * as wishlistService from '../services/wishlist.service.js'
export async function create(req,res,next){ try{ const doc=await wishlistService.create(req.userId, req.body); res.status(201).json({success:true,data:doc})}catch(e){next(e)}}
export async function list(req,res,next){ try{ const items=await wishlistService.list(req.userId); res.json({success:true,data:{items}})}catch(e){next(e)}}
export async function remove(req,res,next){ try{ await wishlistService.remove(req.userId, req.params.type, req.params.id); res.json({success:true,message:'Removed from wishlist'})}catch(e){next(e)}}
