/**
 * Solo, Couple Or Friends – We Have Trips for All
 * Full-width homepage banner placed between Explore Destinations and Upcoming Group Trips.
 * Image is served exclusively from S3 (clean prefix: website/homepage/...) via the
 * backend media proxy `/api/media/<key>`. No local filesystem import.
 * Styling: image as-is, preserve aspect ratio, no overlay/card/border/rounded/cropped.
 */
const S3_KEY = 'website/homepage/solo-couple-friends-banner.avif'
const S3_PROXY_SRC = `/api/media/${S3_KEY}`
// Direct S3 URL (bucket is private, so proxy is used for delivery):
// https://24x7-website.s3.ap-south-1.amazonaws.com/website/homepage/solo-couple-friends-banner.avif

export function SoloCoupleFriendsBanner() {
  return (
    <section aria-label="Solo, Couple Or Friends – We Have Trips for All" className="w-full bg-white">
      <img
        src={S3_PROXY_SRC}
        alt="Solo, Couple Or Friends – We Have Trips for All"
        loading="lazy"
        decoding="async"
        width={1920}
        height={400}
        className="block h-auto w-full"
      />
    </section>
  )
}

export const SOLO_BANNER_S3_KEY = S3_KEY
export const SOLO_BANNER_S3_URL = `https://24x7-website.s3.ap-south-1.amazonaws.com/${S3_KEY}`
export const SOLO_BANNER_PROXY_URL = S3_PROXY_SRC
