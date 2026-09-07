import * as imageStorage from '../services/imageStorage.service.js'
import { isAppKey } from '../utils/imageFolders.js'
import { folderFor } from '../utils/imageFolders.js'

function pickFolder(req) {
  const entity = (req.query.folder || req.body.folder || 'website').toString().trim()
  const id = (req.query.id || req.body.id || '').toString().trim()
  return folderFor(entity, id)
}

export async function uploadOne(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided' })
    const meta = await imageStorage.upload(req.file.buffer, {
      folder: pickFolder(req),
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    })
    res.status(201).json({ success: true, data: meta })
  } catch (err) { next(err) }
}

export async function uploadBatch(req, res, next) {
  try {
    if (!req.files?.length) return res.status(400).json({ success: false, message: 'No image files provided' })
    const folder = pickFolder(req)
    const results = []
    for (const f of req.files) {
      results.push(await imageStorage.upload(f.buffer, { folder, originalName: f.originalname, mimeType: f.mimetype }))
    }
    res.status(201).json({ success: true, data: results })
  } catch (err) { next(err) }
}

export async function uploadOneVideo(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No video file provided' })
    const meta = await imageStorage.upload(req.file.buffer, {
      folder: pickFolder(req),
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    })
    res.status(201).json({ success: true, data: { ...meta, resourceType: 'video' } })
  } catch (err) { next(err) }
}

export async function remove(req, res, next) {
  try {
    const publicId = (req.query.publicId || req.body.publicId || '').toString()
    if (!publicId) return res.status(400).json({ success: false, message: 'publicId is required' })
    // Only allow deleting objects within this application's S3 media prefixes
    // (legacy `travel-crm/...` keys and the new clean-prefix keys).
    if (!isAppKey(publicId)) return res.status(403).json({ success: false, message: 'Forbidden: invalid publicId' })
    await imageStorage.remove(publicId)
    res.status(204).end()
  } catch (err) { next(err) }
}
