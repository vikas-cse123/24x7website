import * as faqService from '../services/faq.service.js'

function notFound(res, message = 'Not found') {
  return res.status(404).json({ success: false, message })
}

// --- admin -------------------------------------------------------------------
export async function list(req, res, next) {
  try {
    const data = await faqService.listAdmin(req.query)
    res.status(200).json({ success: true, data, message: 'FAQs' })
  } catch (err) {
    next(err)
  }
}

export async function getOne(req, res, next) {
  try {
    const faq = await faqService.getAdminById(req.params.id)
    if (!faq) return notFound(res, 'FAQ not found')
    res.status(200).json({ success: true, data: faq })
  } catch (err) {
    next(err)
  }
}

export async function create(req, res, next) {
  try {
    const faq = await faqService.create(req.body)
    res.status(201).json({ success: true, data: faq, message: 'FAQ created' })
  } catch (err) {
    next(err)
  }
}

export async function update(req, res, next) {
  try {
    const faq = await faqService.update(req.params.id, req.body)
    if (!faq) return notFound(res, 'FAQ not found')
    res.status(200).json({ success: true, data: faq, message: 'FAQ updated' })
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    const result = await faqService.remove(req.params.id)
    if (!result) return notFound(res, 'FAQ not found')
    res.status(200).json({ success: true, data: result, message: 'FAQ deleted' })
  } catch (err) {
    next(err)
  }
}

export async function publish(req, res, next) {
  try {
    const faq = await faqService.setPublished(req.params.id, true)
    if (!faq) return notFound(res, 'FAQ not found')
    res.status(200).json({ success: true, data: faq, message: 'FAQ published' })
  } catch (err) {
    next(err)
  }
}

export async function unpublish(req, res, next) {
  try {
    const faq = await faqService.setPublished(req.params.id, false)
    if (!faq) return notFound(res, 'FAQ not found')
    res.status(200).json({ success: true, data: faq, message: 'FAQ unpublished' })
  } catch (err) {
    next(err)
  }
}

export async function reorder(req, res, next) {
  try {
    const result = await faqService.reorder(req.body.items)
    res.status(200).json({
      success: true,
      data: result,
      message: `Reordered ${result.updated} FAQ(s)`,
    })
  } catch (err) {
    next(err)
  }
}
