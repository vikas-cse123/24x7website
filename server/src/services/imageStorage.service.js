// Abstraction — Cloudinary is the current provider.
// Replace this module's internals to switch to S3/R2 without touching callers.
import * as cloudinaryService from './cloudinary.service.js'

export async function upload(buffer, opts) {
  return cloudinaryService.uploadBuffer(buffer, opts)
}
export async function remove(publicId) {
  return cloudinaryService.destroy(publicId)
}
export async function replace(publicId, buffer, opts) {
  // Cloudinary replace = destroy old + upload new (or overwrite with same publicId)
  if (publicId) await cloudinaryService.destroy(publicId).catch(() => {})
  return cloudinaryService.uploadBuffer(buffer, opts)
}
export function getUrl(publicId, transform) {
  return cloudinaryService.deliveryUrl(publicId, transform)
}
export function getSrcSet(publicId, widths) {
  return cloudinaryService.srcSet(publicId, widths)
}
