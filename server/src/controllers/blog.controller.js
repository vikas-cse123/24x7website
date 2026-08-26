import * as blogService from '../services/blog.service.js'

export async function list(req, res, next) {
  try {
    const data = await blogService.listPublished(req.query)
    res.status(200).json({ success: true, data, message: 'Blogs' })
  } catch (err) {
    next(err)
  }
}

export async function listByDestination(req, res, next) {
  try {
    const data = await blogService.listPublished({ ...req.query, destination: req.params.destinationSlug })
        if (data.destination === null && data.total === 0) {
      // Unknown or unpublished destination slug.
      return res.status(404).json({ success: false, message: 'Destination not found' })
    }
    res.status(200).json({ success: true, data, message: 'Destination blogs' })
  } catch (err) {
    next(err)
  }
}

export async function getBySlug(req, res, next) {
  try {
    const blog = await blogService.getPublishedBySlug(req.params.slug)
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' })
    const related = await blogService.relatedPublished(
      { _id: blog.id, destinationId: blog.destination?.id || null, category: blog.category },
      3
    )
    res.status(200).json({ success: true, data: { blog, related }, message: 'Blog' })
  } catch (err) {
    next(err)
  }
}
