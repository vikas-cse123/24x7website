import * as reviewService from '../services/review.service.js'

function notFound(res, message = 'Review not found') {
  return res.status(404).json({ success: false, message })
}

// --- customer ---------------------------------------------------------------
export async function listRecent(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 3, 6)
    const items = await reviewService.listRecentApproved(limit)
    res.status(200).json({ success: true, data: { items }, message: 'Recent reviews' })
  } catch (err) { next(err) }
}

export async function eligibility(req, res, next) {
  try {
    const data = await reviewService.getEligibility(req.params.slugOrId, req.userId)
    res.status(200).json({ success: true, data, message: 'Review eligibility' })
  } catch (err) {
    next(err)
  }
}

export async function listByTrip(req, res, next) {
  try {
    const data = await reviewService.listPublicByTrip(req.params.slugOrId, req.query)
    res.status(200).json({ success: true, data, message: 'Trip reviews' })
  } catch (err) {
    next(err)
  }
}

export async function create(req, res, next) {
  try {
    // userId comes from the auth cookie; tripId is validated against the
    // caller's own qualifying booking inside the service.
    const review = await reviewService.create(req.body, req.userId)
    res.status(201).json({ success: true, data: review, message: 'Review submitted for moderation' })
  } catch (err) {
    next(err)
  }
}

export async function myReviews(req, res, next) {
  try {
    const data = await reviewService.listMine(req.userId, req.query)
    res.status(200).json({ success: true, data, message: 'Your reviews' })
  } catch (err) {
    next(err)
  }
}

// --- admin -------------------------------------------------------------------
export async function adminList(req, res, next) {
  try {
    const data = await reviewService.listAdmin(req.query)
    res.status(200).json({ success: true, data, message: 'Reviews' })
  } catch (err) {
    next(err)
  }
}

export async function adminModerate(req, res, next) {
  try {
    const review = await reviewService.adminSetStatus(
      req.params.id,
      req.body.status,
      req.body.note,
      req.userId
    )
    if (!review) return notFound(res)
    res.status(200).json({ success: true, data: review, message: `Review ${review.status}` })
  } catch (err) {
    next(err)
  }
}

export async function adminRemove(req, res, next) {
  try {
    const result = await reviewService.adminRemove(req.params.id)
    if (!result) return notFound(res)
    res.status(200).json({ success: true, data: result, message: 'Review deleted' })
  } catch (err) {
    next(err)
  }
}
