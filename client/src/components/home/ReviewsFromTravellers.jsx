import * as React from 'react'
import { Container } from '@/components/ui/container'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Star, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// "Reviews From Our Travellers" — 2×2 grid of review cards (photo left,
// stars + text + name right), shown directly below Trending Destinations.
// Clicking a photo opens the full review in a modal (reference behavior).
// Review copy and photos are fixed marketing content; images live in the S3
// media store (travel-crm/home/traveller-reviews/…).

const REVIEW_IMAGE_BASE =
  'https://24x7-website.s3.ap-south-1.amazonaws.com/travel-crm/home/traveller-reviews'

const REVIEWS = [
  {
    name: 'Yash',
    image: `${REVIEW_IMAGE_BASE}/yash.png`,
    text: 'The trip was well-planned and perfectly executed. Great coordination, smooth travel, comfortable stay, and beautiful locations. Every moment was enjoyable and stress-free. Highly recommended for anyone looking for a professional and memorable travel experience',
  },
  {
    name: 'Dishant Soni',
    image: `${REVIEW_IMAGE_BASE}/dishant-soni.png`,
    text: 'Breathtaking Spiti – A Journey to Remember. Just returned from an incredible trip to Spiti Valley, and it was everything I hoped for and more. The landscapes were absolutely surreal – from high mountain passes to ancient monasteries and serene villages, every moment felt like a postcard come to life.',
  },
  {
    name: 'suleman ahmad',
    image: `${REVIEW_IMAGE_BASE}/suleman-ahmad.png`,
    text: 'An Unforgettable Experience! I recently went on a trip to meghalaya with "24x7Chhutti" and it was truly one of the best experiences I\'ve ever had. From the moment I arrived, the Captain "Masoom Raza" was incredibly welcoming and supportive he handled the trip very well so that everything can be on time, also the amenities they provided were really comfortable.',
  },
  {
    name: 'Virender Singh',
    image: `${REVIEW_IMAGE_BASE}/virendra-singh.png`,
    text: 'I recently booked my vacation through 24x7Chhutti, and I must say, it was one of the best travel experiences I\'ve had! From the moment I reached out, their team was super responsive and helpful. They listened to all my preferences and curated an itinerary that perfectly matched what I was looking for. The trip was very well organized from comfortable stays to smooth transportation and a knowledgeable trip captain who made the journey even more fun. Highly recommend 24x7Chhutti for anyone looking for hassle-free and make beautiful memories!',
  },
]

function Stars() {
  return (
    <div className="flex justify-center gap-1" aria-label="Rated 5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden="true" />
      ))}
    </div>
  )
}

export function ReviewsFromTravellers() {
  const [active, setActive] = React.useState(null)
  const [expanded, setExpanded] = React.useState(() => REVIEWS.map(() => false))

  return (
    <section aria-label="Reviews from our travellers" className="bg-background py-12 lg:py-16">
      <Container>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Reviews From Our Travellers
        </h2>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {REVIEWS.map((review, i) => (
            <article
              key={review.name}
              className="flex flex-col overflow-hidden rounded-xl bg-card shadow-card sm:flex-row"
            >
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Open full review by ${review.name}`}
                className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[240px]"
              >
                <img
                  src={review.image}
                  alt={`${review.name} — traveller group photo`}
                  loading="lazy"
                  decoding="async"
                  className="h-52 w-full object-cover sm:h-full"
                />
              </button>

              <div className="flex flex-1 flex-col p-5">
                <Stars />
                <p
                  className={cn(
                    'mt-4 flex-1 text-center text-sm leading-relaxed text-gray-600',
                    !expanded[i] && 'line-clamp-4'
                  )}
                >
                  {review.text}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((prev) => prev.map((v, j) => (j === i ? !v : v)))
                  }
                  className="mx-auto mt-1 text-sm font-medium text-sky-600 hover:underline"
                >
                  {expanded[i] ? 'Read less' : 'Read more...'}
                </button>
                <p className="mt-auto pt-4 text-center text-[15px] font-semibold text-gray-900">
                  {review.name}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Container>

      {/* Full review modal — image on top, stars, complete text, name. */}
      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        {active !== null && (
          <DialogContent
            showClose={false}
            className="mx-4 overflow-hidden rounded-2xl bg-card shadow-xl"
          >
            <div className="relative">
              <img
                src={REVIEWS[active].image}
                alt={`${REVIEWS[active].name} — traveller group photo`}
                className="block h-56 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label="Close review"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-gray-900 shadow-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 pb-6 pt-4">
              <Stars />
              <p className="mt-3 text-center text-sm leading-relaxed text-gray-700">
                {REVIEWS[active].text}
              </p>
              <p className="mt-4 text-center text-lg font-bold text-gray-900">
                {REVIEWS[active].name}
              </p>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  )
}
