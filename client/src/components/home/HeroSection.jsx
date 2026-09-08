import * as React from 'react'
import { Volume2, VolumeX } from 'lucide-react'

// Homepage hero — full-width background video only, with a small sound toggle
// in the bottom-right corner. No text, search, badge, buttons or overlays sit
// on top of the video. The video always starts muted; audio is only enabled
// after the user explicitly clicks the sound button. The audio state is never
// persisted — every page load/reload begins muted again.
// Video is stored in S3 (24x7-website) and served via the app's
// existing S3 media proxy (/api/media/...) which correctly handles
// Range requests and Content-Type. The CloudFront URL for the same key
// (https://d1zvcmhypeawxj.cloudfront.net/home/video_web/home-video.mp4)
// currently returns NoSuchKey from the origin, so the proxy is used
// to keep the current S3/CloudFront architecture without re-uploading.
const HERO_VIDEO_URL = '/api/media/website/home/video_web/home-video.mp4'

export function HeroSection() {
  const videoRef = React.useRef(null)
  const [muted, setMuted] = React.useState(true)

  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined
    video.muted = true
    const attempt = () => {
      video.muted = true
      const p = video.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    }
    attempt()
    const onCanPlay = () => attempt()
    video.addEventListener('canplay', onCanPlay)
    const onLoaded = () => attempt()
    video.addEventListener('loadeddata', onLoaded)
    return () => {
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('loadeddata', onLoaded)
    }
  }, [])

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
          src={HERO_VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='600' viewBox='0 0 1920 600'%3E%3Crect width='1920' height='600' fill='%23000'/%3E%3C/svg%3E"
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
