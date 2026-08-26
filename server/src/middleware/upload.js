import multer from 'multer'

const storage = multer.memoryStorage()

function fileFilter(_req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'), false)
  }
  cb(null, true)
}

export const uploadSingle = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter,
}).single('image')

export const uploadMany = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter,
}).array('images', 10)

export function handleMulterError(err, _req, res, next) {
  if (!err) return next()
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ success: false, message: 'File too large (max 5 MB)' })
    return res.status(400).json({ success: false, message: err.message })
  }
  return res.status(400).json({ success: false, message: err.message })
}
