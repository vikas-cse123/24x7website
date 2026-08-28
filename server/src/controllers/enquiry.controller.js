import * as enquiryService from '../services/enquiry.service.js'

function notFound(res, message = 'Enquiry not found') {
  return res.status(404).json({ success: false, message })
}

// --- public ----------------------------------------------------------------
export async function create(req, res, next) {
  try {
    const enquiry = await enquiryService.createPublic(req.body, req.userId || null)
    res.status(201).json({ success: true, data: enquiry, message: 'Enquiry received' })
  } catch (err) {
    next(err)
  }
}

// --- admin (RBAC enforced at the admin router) ------------------------------
export async function list(req, res, next) {
  try {
    const data = await enquiryService.listAdmin(req.query)
    res.status(200).json({ success: true, data, message: 'Enquiries' })
  } catch (err) {
    next(err)
  }
}

export async function getOne(req, res, next) {
  try {
    const enquiry = await enquiryService.getAdminById(req.params.id)
    if (!enquiry) return notFound(res)
    res.status(200).json({ success: true, data: enquiry })
  } catch (err) {
    next(err)
  }
}

export async function updateStatus(req, res, next) {
  try {
    const enquiry = await enquiryService.setStatus(req.params.id, req.body.status)
    if (!enquiry) return notFound(res)
    res.status(200).json({ success: true, data: enquiry, message: 'Enquiry updated' })
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    const result = await enquiryService.remove(req.params.id)
    if (!result) return notFound(res)
    res.status(200).json({ success: true, data: result, message: 'Enquiry deleted' })
  } catch (err) {
    next(err)
  }
}