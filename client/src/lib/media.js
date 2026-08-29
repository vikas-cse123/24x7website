// S3 media URL helpers.
// Uploaded media stores the S3 object URL in `url`/`secureUrl` and the object
// key in `publicId`. There are no on-the-fly image transformations on S3, so
// `resolveImageSrc` simply returns the stored URL and no responsive srcSet is
// generated. Legacy Cloudinary records keep their Cloudinary URLs and still
// resolve because `secureUrl`/`url` are preserved.

export function resolveImageSrc(img) {
  if (!img) return ''
  if (img.secureUrl) return img.secureUrl
  if (img.url) return img.url
  if (img.publicId && /^https?:\/\//.test(img.publicId)) return img.publicId
  return ''
}

// S3 has no built-in image resizing — no responsive srcSet is produced.
export function resolveSrcSet() {
  return undefined
}