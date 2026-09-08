export const VIDEO_BASE = '/api/media/vibe-videos'
export const VIDEOS = Array.from({ length: 8 }, (_, i) => `${VIDEO_BASE}/video-${i + 1}.mp4`)
// S3 keys for direct presigned delivery — bucket remains private, Node only signs.
export const VIBE_S3_PREFIX = 'vibe-videos/'
export const VIBE_KEYS = Array.from({ length: 8 }, (_, i) => `${VIBE_S3_PREFIX}video-${i + 1}.mp4`)
export const VIBE_S3_KEYS = VIBE_KEYS
export function vibeKeyForIndex(i) {
  return `${VIBE_S3_PREFIX}video-${i + 1}.mp4`
}
export function vibeFallbackForIndex(i) {
  return `${VIDEO_BASE}/video-${i + 1}.mp4`
}
export function vibePresignEndpoint(key) {
  return `/api/media/presign-vibe?key=${encodeURIComponent(key)}`
}
