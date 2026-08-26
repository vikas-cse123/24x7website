import crypto from 'node:crypto'
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js'

function toPublicMeta(result) {
  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    url: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
    resourceType: result.resource_type,
  }
}

// Upload buffer to Cloudinary. Folder is logical (e.g. travel-crm/trips/{id}).
export async function uploadBuffer(buffer, { folder, publicId } = {}) {
  if (!isCloudinaryConfigured) {
    const err = new Error('Cloudinary is not configured. Set CLOUDINARY_* env vars.')
    err.status = 503
    throw err
  }
  const opts = {
    folder: folder || 'travel-crm/website',
    resource_type: 'image',
    unique_filename: true,
    overwrite: false,
  }
  if (publicId) opts.public_id = publicId
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) return reject(Object.assign(err, { status: 502 }))
      resolve(toPublicMeta(result))
    })
    stream.end(buffer)
  })
}

export async function destroy(publicId) {
  if (!isCloudinaryConfigured) {
    const err = new Error('Cloudinary is not configured')
    err.status = 503
    throw err
  }
  if (!publicId) {
    const err = new Error('publicId is required')
    err.status = 400
    throw err
  }
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true })
}

// Delivery URL helpers — no API secret needed, pure string transform.
export function deliveryUrl(publicId, { w, h, crop = 'fill', quality = 'auto', fetchFormat = 'auto' } = {}) {
  if (!publicId) return ''
  const t = [`f_${fetchFormat}`, `q_${quality}`]
  if (w) t.push(`w_${w}`)
  if (h) t.push(`h_${h}`)
  if (w || h) t.push(`c_${crop}`)
  // when not configured we still return a transform-path style URL (preview only)
  const cloud = process.env.CLOUDINARY_CLOUD_NAME || 'demo'
  return `https://res.cloudinary.com/${cloud}/image/upload/${t.join(',')}/${publicId}`
}

export function srcSet(publicId, widths = [320, 640, 960, 1280, 1600]) {
  return widths.map((w) => `${deliveryUrl(publicId, { w })} ${w}w`).join(', ')
}
