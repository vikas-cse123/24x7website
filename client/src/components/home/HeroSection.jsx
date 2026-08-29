import * as React from 'react'
import { Volume2, VolumeX } from 'lucide-react'

// Homepage hero — full-width background video only, with a small sound toggle
// in the bottom-right corner. No text, search, badge, buttons or overlays sit
// on top of the video. The video always starts muted; audio is only enabled
// after the user explicitly clicks the sound button. The audio state is never
// persisted — every page load/reload begins muted again.
const HERO_VIDEO_URL =
  'https://d1zvcmhypeawxj.cloudfront.net/home/video_web/web-main-banner--mp4-b13fd942f1-1759143371864.mp4'

export function HeroSection() {
  const videoRef = React.useRef(null)
  const [muted, setMuted] = React.useState(true)

  // React does not reliably serialize the `muted` attribute on <video>, which
  // can break autoplay under browser autoplay policies. Explicitly force muted
  // and kick off playback so the background video always starts automatically.
  // We only ever call play() while muted; unmuting happens solely via the
  // sound button so autoplay is never blocked by the browser.
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
    // Ensure playback continues after toggling (the browser may have suspended
    // the muted autoplay when audio was enabled).
    const p = video.play()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  }

  return (
    <section className="relative flex min-h-[400px] items-center overflow-hidden sm:min-h-[460px]">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={HERO_VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        controls={false}
      />

      {/* Sound toggle — small, bottom-right, no background */}
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
    </section>
  )
}