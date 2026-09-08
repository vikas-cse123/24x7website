import * as React from 'react'
import { Volume2, VolumeX } from 'lucide-react'

// Homepage hero — full-width background video only, with a small sound toggle
// in the bottom-right corner. No text, search, badge, buttons or overlays sit
// on top of the video. The video always starts muted; audio is only enabled
// after the user explicitly clicks the sound button. The audio state is never
// persisted — every page load/reload begins muted again.
// Video stored in S3 (24x7-website, ap-south-1, key website/home/video_web/home-video.mp4).
// Bucket is private — no public policy, no CloudFront. Hero delivery is:
// browser -> GET /api/media/presign (whitelisted to this single key, 1h expiry) -> browser -> S3 directly
// with presigned URL (supports Range). Fallback to /api/media proxy only if presign fails.
// No other media changed. Poster does not exist at website/home/video_web/home-video-poster.jpg (HeadObject 404).
const HERO_KEY = 'website/home/video_web/home-video.mp4'
const HERO_FALLBACK_URL = '/api/media/website/home/video_web/home-video.mp4'
const HERO_PRESIGN_ENDPOINT = `/api/media/presign?key=${encodeURIComponent(HERO_KEY)}`
const HERO_POSTER_URL = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22/%3E'

export function HeroSection() {
  const videoRef = React.useRef(null)
  const [muted, setMuted] = React.useState(true)
  const [videoSrc, setVideoSrc] = React.useState(null)

  // Fetch presigned S3 URL (private bucket, direct S3 bytes). No spinner, no layout shift —
  // hero container renders immediately with bg-black; video starts loading only after URL resolves.
  // On presign failure, fall back to the proven proxy URL so hero still plays.
  React.useEffect(() => {
    let cancelled = false
    fetch(HERO_PRESIGN_ENDPOINT, { headers: { Accept: 'application/json' } })
      .then((res) => {
        if (!res.ok) throw new Error(`presign ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        if (data && typeof data.url === 'string' && data.url.length > 0) setVideoSrc(data.url)
        else setVideoSrc(HERO_FALLBACK_URL)
      })
      .catch(() => {
        if (!cancelled) setVideoSrc(HERO_FALLBACK_URL)
      })
    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined
    video.muted = true
    const attempt = () => {
      video.muted = true
      const p = video.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    }
    // If src already set, attempt immediately; otherwise attempt will fire on canplay/loadeddata after src loads
    if (videoSrc) attempt()
    const onCanPlay = () => attempt()
    video.addEventListener('canplay', onCanPlay)
    const onLoaded = () => attempt()
    video.addEventListener('loadeddata', onLoaded)
    return () => {
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('loadeddata', onLoaded)
    }
  }, [videoSrc])

  function toggleSound() {
    const video = videoRef.current
    if (!video) return
    const next = !video.muted
    video.muted = next
    setMuted(next)
    const p = video.play()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  }

  return (
    <section className="relative w-full overflow-hidden bg-black">
      <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/9] lg:aspect-[3.17/1] lg:min-h-[460px]">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc || undefined}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={HERO_POSTER_URL}
          disablePictureInPicture
          controls={false}
        />

        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
          className="absolute bottom-4 right-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {muted ? (
            <VolumeX className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Volume2 className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </section>
  )
}
