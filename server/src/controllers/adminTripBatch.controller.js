import * as tripBatchService from '../services/tripBatch.service.js'

function notFound(res) {
  return res.status(404).json({ success: false, message: 'Trip batch not found' })
}

export async function list(req, res, next) {
  try {
    const data = await tripBatchService.listAdmin(req.query)
    res.status(200).json({ success: true, data, message: 'Trip batches' })
  } catch (err) {
    next(err)
  }
}

export async function getOne(req, res, next) {
  try {
    const batch = await tripBatchService.getAdminById(req.params.id)
    if (!batch) return notFound(res)
    res.status(200).json({ success: true, data: batch })
  } catch (err) {
    next(err)
  }
}

export async function create(req, res, next) {
  try {
    const batch = await tripBatchService.create(req.body, req.userId)
    res.status(201).json({ success: true, data: batch, message: 'Trip batch created' })
  } catch (err) {
    next(err)
  }
}

export async function update(req, res, next) {
  try {
    const batch = await tripBatchService.update(req.params.id, req.body, req.userId)
    if (!batch) return notFound(res)
    res.status(200).json({ success: true, data: batch, message: 'Trip batch updated' })
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    const batch = await tripBatchService.remove(req.params.id)
    if (!batch) return notFound(res)
    res.status(200).json({ success: true, message: 'Trip batch deleted' })
  } catch (err) {
    next(err)
  }
}

export async function publish(req, res, next) {
  try {
    const batch = await tripBatchService.setPublished(req.params.id, true, req.userId)
    if (!batch) return notFound(res)
    res.status(200).json({ success: true, data: batch, message: 'Trip batch published' })
  } catch (err) {
    next(err)
  }
}

export async function unpublish(req, res, next) {
  try {
    const batch = await tripBatchService.setPublished(req.params.id, false, req.userId)
    if (!batch) return notFound(res)
    res.status(200).json({ success: true, data: batch, message: 'Trip batch unpublished' })
  } catch (err) {
    next(err)
  }
}

export async function changeStatus(req, res, next) {
  try {
    const batch = await tripBatchService.setStatus(req.params.id, req.body.status, req.userId)
    if (!batch) return notFound(res)
    res.status(200).json({ success: true, data: batch, message: 'Trip batch status updated' })
  } catch (err) {
    next(err)
  }
}
