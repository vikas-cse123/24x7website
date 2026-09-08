import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const storage = multer.memoryStorage()

const tmpDir = path.join(os.tmpdir(), 'chhutti-uploads')
try { fs.mkdirSync(tmpDir, { recursive: true }) } catch {}

const diskStorage = multer.diskStorage({
  destination(_req, _file, cb) { cb(null, tmpDir) },
  filename(_req, file, cb) {
    const safe = path.basename(file.originalname || 'upload').replace(/[^A-Za-z0-9._-]/g, '_')
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`)
  },
})

function fileFilter(_req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'), false)
  }
  cb(null, true)
}

export const uploadSingle = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter,
}).single('image')

export const uploadMany = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter,
}).array('images', 10)

function videoFileFilter(_req, file, cb) {
  if (!file.mimetype.startsWith('video/')) {
    return cb(new Error('Only video files are allowed'), false)
  }
  cb(null, true)
}

// Destination page hero videos. Larger limit for short hero clips; stored via
// the same S3 media system (publicId tracked for cleanup/reference checks).
// Use disk storage so 100MB videos do not fully buffer in Node heap.
export const uploadVideo = multer({
  storage: diskStorage,
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
  fileFilter: videoFileFilter,
}).single('video')

export function cleanupTempFile(file) {
  if (!file?.path) return
  fs.unlink(file.path, () => {})
}

export function handleMulterError(err, _req, res, next) {
  if (!err) return next()
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ success: false, message: 'File too large' })
    return res.status(400).json({ success: false, message: err.message })
  }
  return res.status(400).json({ success: false, message: err.message })
}
