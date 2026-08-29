// Storage abstraction — AWS S3 is the current provider.
// Callers use imageStorage.upload / remove / replace and never touch S3
// directly. Swap the provider by changing this module's internals.
import * as s3Service from './s3.service.js'

export async function upload(buffer, opts) {
  return s3Service.uploadBuffer(buffer, opts)
}

export async function remove(objectKey) {
  return s3Service.destroy(objectKey)
}

export async function replace(objectKey, buffer, opts) {
  // S3 replace = delete old + upload new.
  if (objectKey) await s3Service.destroy(objectKey).catch(() => {})
  return s3Service.uploadBuffer(buffer, opts)
}

export function getUrl(objectKey) {
  return s3Service.deliveryUrl(objectKey)
}

export function getSrcSet() {
  return s3Service.srcSet()
}