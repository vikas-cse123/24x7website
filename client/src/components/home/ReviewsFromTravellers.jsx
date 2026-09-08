import * as React from 'react'
import { Container } from '@/components/ui/container'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Star, X } from 'lucide-react'
import { HorizontalCarousel } from '@/components/ui/horizontal-carousel'

// "Reviews From Our Travellers" — 2×2 grid of review cards (photo left,
// stars + text + name right), shown directly below Trending Destinations.
// Clicking a photo opens the full review in a modal (reference behavior).
// Review copy and photos are fixed marketing content; images live in the S3
// media store (website/homepage/reviews/… — clean prefix).

const REVIEWS = [
  {
    name: 'Naval Khanna',
    image: '/api/media/website/homepage/reviews/1788817433192-39acb128-298b-4c9d-8d39-a6875eabb919.png',
    text: 'I went with my children (total 9 adults) to Jim Corbett on 28th June. The trip was planned by 24 x 7 in a very well maintained URBANIA and hotel was Welcome by ITC. The whole experience was wonderful. What I liked of 24 x 7 was there continuous review of our well being on all days which is highly appreciated',
  },
  {
    name: 'Anita Kumar',
    image: '/api/media/website/homepage/reviews/1788817433683-68cd5791-b1fe-489e-afb3-f8b4e5e9238f.png',
    text: 'We took the 15 days Rajasthan trip with Mr. Harish Gupta and worked with him. He is very good to work with and he planned our trip very well. We had an excellent trip our driver, hotel and sightseeing was very memorable. Thanks Harishji and Kalpanaji for doing great job.',
  },
  {
    name: 'Manish Gupta',
    image: '/api/media/website/homepage/reviews/1788817434299-07924f55-f6ef-4ab5-a612-5df29a530469.png',
    text: 'Everything was so Great love with dubai Thanks to 24x7 Chhutti well organised everything is well managed Budget friendly Tour We stay at Atlantic the palm, W abu dabhi Accommodation was so good Again Thanks To 24X7 Chhutti for Amazing Trip Highly Recommended',
  },
  {
    name: 'Kesar',
    image: '/api/media/website/homepage/reviews/1788817434855-3381a4ea-43dd-485d-ab27-3a9b2c70d639.png',
    text: 'Best experience with chutti 24*7. Service you provide is awesome best service and specially the drivers in thailand. i am facing language issue but ur guide manage well in that. Thank u for the deal will make next trip soo. And suggest people to book holdiays with you without any tentions. thanks mr.harish ji and team👍👍👍',
  },
]

function Stars() {
  return (
    <div className="flex justify-center gap-1.5" aria-label="Rated 5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
      ))}
    </div>
  )
}

export function ReviewsFromTravellers() {
  const [active, setActive] = React.useState(null)
  const [expanded, setExpanded] = React.useState(() => REVIEWS.map(() => false))
  const [current, setCurrent] = React.useState(0)
  const trackRef = React.useRef(null)

  const onSelect = (idx) => {
    setCurrent(idx)
    const el = trackRef.current
    if (el) {
      const card = el.children[idx]
      card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }

  return (
    <section id="reviews" aria-label="Reviews from our travellers" className="bg-background py-12 lg:py-16 scroll-mt-24">
      <Container className="max-w-none mx-0 w-full px-5 sm:px-6 lg:px-[90px]">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Reviews From Our Travellers
        </h2>

        {/* Mobile: horizontal single-card carousel with peek, Dots; Desktop: 2-col grid */}
        <div className="mt-8 lg:hidden">
          <HorizontalCarousel
            aria-label="Traveller reviews"
            itemClassName="w-[88vw] max-w-[380px]"
          >
            {REVIEWS.map((review, i) => (
              <article
                key={review.name}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Open full review by ${review.name}`}
                  className="relative block overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <img
                    src={review.image}
                    alt={`${review.name} — traveller group photo`}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </button>
                <div className="flex flex-1 flex-col p-5">
                  <Stars />
                  <p
                    className={`mt-3 text-center text-[14px] leading-[1.7] text-slate-600 ${!expanded[i] ? 'line-clamp-4' : ''}`}
                  >
                    {review.text}
                  </p>
                  {!expanded[i] && review.text.length > 180 && (
                    <button
                      type="button"
                      onClick={() => setExpanded((prev) => prev.map((v, j) => (j === i ? true : v)))}
                      className="mx-auto mt-1 text-sm font-medium text-sky-600 hover:underline"
                    >
                      Read more...
                    </button>
                  )}
                  {expanded[i] && (
                    <button
                      type="button"
                      onClick={() => setExpanded((prev) => prev.map((v, j) => (j === i ? false : v)))}
                      className="mx-auto mt-1 text-sm font-medium text-sky-600 hover:underline"
                    >
                      Read less
                    </button>
                  )}
                  <p className="mt-4 text-center text-[14px] font-bold tracking-tight text-slate-900">
                    {review.name}
                  </p>
                </div>
              </article>
            ))}
          </HorizontalCarousel>
          <div className="mt-4 flex justify-center gap-2">
            {REVIEWS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`Go to review ${i + 1}`}
                aria-current={current === i}
                className={`h-2 w-2 rounded-full transition-colors ${current === i ? 'bg-slate-900' : 'bg-slate-300'}`}
              />
            ))}
          </div>
        </div>

        <div className="hidden grid-cols-2 gap-7 lg:grid">
          {REVIEWS.map((review, i) => (
            <article
              key={review.name}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md sm:flex-row"
            >
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Open full review by ${review.name}`}
                className="relative shrink-0 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[260px]"
              >
                <img
                  src={review.image}
                  alt={`${review.name} — traveller group photo`}
                  loading="lazy"
                  decoding="async"
                  className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] sm:h-full sm:min-h-[280px]"
                />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5" aria-hidden="true" />
              </button>

              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <Stars />
                <p className="mt-4 text-center text-[14px] leading-[1.75] text-slate-600">
                  {review.text}
                </p>
                <div className="mt-5 flex flex-col items-center gap-3">
                  <span className="h-px w-10 bg-slate-200" aria-hidden="true" />
                  <p className="text-center text-[14px] font-bold tracking-tight text-slate-900">
                    {review.name}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>

      {/* Full review modal — consistent image viewport and spacing for every review. */}
      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        {active !== null && (
          <DialogContent
            showClose={false}
            className="w-full overflow-hidden rounded-2xl bg-white p-0 shadow-xl border-0"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-slate-100">
              <img
                src={REVIEWS[active].image}
                alt={`${REVIEWS[active].name} — traveller group photo`}
                className="h-full w-full object-cover"
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
            <div className="flex flex-col items-center gap-4 px-6 pb-6 pt-5">
              <Stars />
              <p className="text-center text-[15px] leading-[1.7] text-slate-700">
                {REVIEWS[active].text}
              </p>
              <div className="flex flex-col items-center gap-3 pt-1">
                <span className="h-px w-10 bg-slate-200" aria-hidden="true" />
                <p className="text-center text-[15px] font-bold tracking-tight text-slate-900">
                  {REVIEWS[active].name}
                </p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  )
}
