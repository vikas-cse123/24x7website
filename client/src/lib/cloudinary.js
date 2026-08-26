export function cldUrl(publicId, { w, h, crop = 'fill' } = {}) {
  if (!publicId) return ''
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  if (!cloud) return ''
  const t = ['f_auto','q_auto']
  if (w) t.push(`w_${w}`)
  if (h) t.push(`h_${h}`)
  if (w || h) t.push(`c_${crop}`)
  return `https://res.cloudinary.com/${cloud}/image/upload/${t.join(',')}/${publicId}`
}
export function cldSrcSet(publicId, widths=[320,640,960,1280,1600]) {
  if (!publicId) return undefined
  const url = cldUrl(publicId, { w: widths[0] })
  if (!url) return undefined
  return widths.map(w => `${cldUrl(publicId,{w})} ${w}w`).filter(Boolean).join(', ') || undefined
}
export function resolveImageSrc(img, { w } = {}) {
  if (!img) return ''
  if (img.publicId) {
    const cloudUrl = cldUrl(img.publicId, { w })
    if (cloudUrl) return cloudUrl
    if (img.secureUrl) return img.secureUrl
    return img.url || ''
  }
  if (img.secureUrl) return img.secureUrl
  return img.url || ''
}
export function resolveSrcSet(img) {
  if (!img?.publicId) return undefined
  return cldSrcSet(img.publicId)
}
