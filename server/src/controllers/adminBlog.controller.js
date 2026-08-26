import * as blogService from '../services/blog.service.js'
import User from '../models/User.js'

function notFound(res, message = 'Blog not found') {
  return res.status(404).json({ success: false, message })
}

export async function list(req, res, next) {
  try {
    const data = await blogService.listAdmin(req.query)
    res.status(200).json({ success: true, data, message: 'Blogs' })
  } catch (err) {
    next(err)
  }
}

export async function getOne(req, res, next) {
  try {
    const blog = await blogService.getAdminById(req.params.id)
    if (!blog) return notFound(res)
    res.status(200).json({ success: true, data: blog })
  } catch (err) {
    next(err)
  }
}

export async function create(req, res, next) {
  try {
    // Author display name is derived server-side from the admin user.
    const adminUser = await User.findById(req.userId).select('name').lean()
    const blog = await blogService.create(
      req.body,
      { id: req.userId, name: adminUser?.name || '' }
    )
    res.status(201).json({ success: true, data: blog, message: 'Blog created' })
  } catch (err) {
    next(err)
  }
}

export async function update(req, res, next) {
  try {
    const adminUser = await User.findById(req.userId).select('name').lean()
    const blog = await blogService.update(
      req.params.id,
      req.body,
      { id: req.userId, name: adminUser?.name || '' }
    )
    if (!blog) return notFound(res)
    res.status(200).json({ success: true, data: blog, message: 'Blog updated' })
  } catch (err) {
    next(err)
  }
}

export async function publish(req, res, next) {
  try {
    const blog = await blogService.setPublished(req.params.id, true, req.userId)
    if (!blog) return notFound(res)
    res.status(200).json({ success: true, data: blog, message: 'Blog published' })
  } catch (err) {
    next(err)
  }
}

export async function unpublish(req, res, next) {
  try {
    const blog = await blogService.setPublished(req.params.id, false, req.userId)
    if (!blog) return notFound(res)
    res.status(200).json({ success: true, data: blog, message: 'Blog unpublished' })
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    const result = await blogService.remove(req.params.id)
    if (!result) return notFound(res)
    res.status(200).json({ success: true, data: result, message: 'Blog deleted' })
  } catch (err) {
    next(err)
  }
}
