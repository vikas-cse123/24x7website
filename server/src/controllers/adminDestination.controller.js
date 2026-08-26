import * as destinationService from '../services/destination.service.js'

function notFound(res) {
  return res.status(404).json({ success: false, message: 'Destination not found' })
}

export async function list(req, res, next) {
  try {
    const data = await destinationService.listAdmin(req.query)
    res.status(200).json({ success: true, data, message: 'Destinations' })
  } catch (err) {
    next(err)
  }
}

export async function getOne(req, res, next) {
  try {
    const destination = await destinationService.getAdminById(req.params.id)
    if (!destination) return notFound(res)
    res.status(200).json({ success: true, data: destination })
  } catch (err) {
    next(err)
  }
}

export async function create(req, res, next) {
  try {
    const destination = await destinationService.create(req.body, req.userId)
    res.status(201).json({ success: true, data: destination, message: 'Destination created' })
  } catch (err) {
    next(err)
  }
}

export async function update(req, res, next) {
  try {
    const destination = await destinationService.update(req.params.id, req.body, req.userId)
    if (!destination) return notFound(res)
    res.status(200).json({ success: true, data: destination, message: 'Destination updated' })
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    const destination = await destinationService.remove(req.params.id)
    if (!destination) return notFound(res)
    res.status(200).json({ success: true, message: 'Destination deleted' })
  } catch (err) {
    next(err)
  }
}

export async function publish(req, res, next) {
  try {
    const destination = await destinationService.setPublished(req.params.id, true, req.userId)
    if (!destination) return notFound(res)
    res.status(200).json({ success: true, data: destination, message: 'Destination published' })
  } catch (err) {
    next(err)
  }
}

export async function unpublish(req, res, next) {
  try {
    const destination = await destinationService.setPublished(req.params.id, false, req.userId)
    if (!destination) return notFound(res)
    res.status(200).json({ success: true, data: destination, message: 'Destination unpublished' })
  } catch (err) {
    next(err)
  }
}