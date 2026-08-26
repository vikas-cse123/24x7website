import * as tripService from '../services/trip.service.js'

function notFound(res) {
  return res.status(404).json({ success: false, message: 'Trip not found' })
}

export async function list(req, res, next) {
  try {
    const data = await tripService.listAdmin(req.query)
    res.status(200).json({ success: true, data, message: 'Trips' })
  } catch (err) {
    next(err)
  }
}

export async function getOne(req, res, next) {
  try {
    const trip = await tripService.getAdminById(req.params.id)
    if (!trip) return notFound(res)
    res.status(200).json({ success: true, data: trip })
  } catch (err) {
    next(err)
  }
}

export async function create(req, res, next) {
  try {
    const trip = await tripService.create(req.body, req.userId)
    res.status(201).json({ success: true, data: trip, message: 'Trip created' })
  } catch (err) {
    next(err)
  }
}

export async function update(req, res, next) {
  try {
    const trip = await tripService.update(req.params.id, req.body, req.userId)
    if (!trip) return notFound(res)
    res.status(200).json({ success: true, data: trip, message: 'Trip updated' })
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    const trip = await tripService.remove(req.params.id)
    if (!trip) return notFound(res)
    res.status(200).json({ success: true, message: 'Trip deleted' })
  } catch (err) {
    next(err)
  }
}

export async function publish(req, res, next) {
  try {
    const trip = await tripService.setPublished(req.params.id, true, req.userId)
    if (!trip) return notFound(res)
    res.status(200).json({ success: true, data: trip, message: 'Trip published' })
  } catch (err) {
    next(err)
  }
}

export async function unpublish(req, res, next) {
  try {
    const trip = await tripService.setPublished(req.params.id, false, req.userId)
    if (!trip) return notFound(res)
    res.status(200).json({ success: true, data: trip, message: 'Trip unpublished' })
  } catch (err) {
    next(err)
  }
}