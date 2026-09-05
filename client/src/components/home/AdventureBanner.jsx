import { Container } from '@/components/ui/container'

// "Adventure awaits you." — decorative banner shown below Travel Blogs.
// Image is served from the existing S3 media store.
const BANNER_URL =
  'https://24x7-website.s3.ap-south-1.amazonaws.com/travel-crm/home/adventure-awaits/oi.png'

export function AdventureBanner() {
  return (
    <section aria-label="Adventure awaits you" className="bg-white">
      <Container className="py-8 lg:py-10">
        <img
          src={BANNER_URL}
          alt="Adventure awaits you — airplane flying along a looping trail"
          loading="lazy"
          className="mx-auto block w-full max-w-4xl rounded-xl object-cover"
        />
      </Container>
    </section>
  )
}
