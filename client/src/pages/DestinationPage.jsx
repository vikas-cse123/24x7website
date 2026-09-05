import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import * as React from 'react'
import { MapPin, IndianRupee, ArrowLeft, HelpCircle, X } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { DestinationCard } from '@/components/destinations/DestinationCard'
import { TripCard } from '@/components/trips/TripCard'
import { Accordion } from '@/components/ui/accordion'
import { Lightbox } from '@/components/ui/lightbox'
import { PlanTripTrigger } from '@/components/enquiry/PlanTripTrigger'
import { destinationApi } from '@/services/destinations'
import { tripApi } from '@/services/trips'
import { faqApi } from '@/services/faqs'
import { useSeo, destinationSeoTitle } from '@/lib/seo'
import { createPortal } from 'react-dom'

function stripHtml(html) {
  if (!html) return ''
  // Create temp element to strip tags safely
  try {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim()
  } catch {
    return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
}

function getPreviewText(description, maxChars = 180) {
  if (!description) return ''
  const text = /<[a-z][\s\S]*>/i.test(description) ? stripHtml(description) : String(description).replace(/\s+/g, ' ').trim()
  if (text.length <= maxChars) return text
  const sliced = text.slice(0, maxChars)
  const lastSpace = sliced.lastIndexOf(' ')
  const truncated = lastSpace > 100 ? sliced.slice(0, lastSpace) : sliced
  return truncated + '...'
}

function DescriptionModal({ open, onClose, title, description }) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const isRich = /<[a-z][\s\S]*>/i.test(String(description || ''))

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${title} description`}
        className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="pr-8 text-base font-semibold sm:text-lg">{title} Tour Packages</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close description"
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">
          {isRich ? (
            <div
              className="prose prose-sm max-w-none break-words prose-headings:font-semibold prose-h2:text-base prose-h3:text-sm prose-p:my-3 prose-a:text-primary prose-a:underline prose-strong:font-semibold prose-ul:list-disc prose-ol:list-decimal prose-li:my-1 prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:pl-3 prose-blockquote:italic"
              dangerouslySetInnerHTML={{ __html: String(description) }}
            />
          ) : (
            <div className="space-y-4 text-sm leading-relaxed text-gray-700">
              {String(description || '')
                .split(/\n{2,}/)
                .map((p) => p.trim())
                .filter(Boolean)
                .flatMap((p) => p.split(/\n/).map((s) => s.trim()).filter(Boolean))
                .map((para, i) => (
                  <p key={i} className="whitespace-pre-wrap break-words">
                    {para}
                  </p>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export function DestinationPage() {
  const { slug } = useParams()
  const [galleryIndex, setGalleryIndex] = React.useState(null)
  const [showDescriptionModal, setShowDescriptionModal] = React.useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['destinations', 'slug', slug],
    queryFn: () => destinationApi.getBySlug(slug),
    retry: false,
  })

  const destination = data?.data?.data

  const tripsQuery = useQuery({
    queryKey: ['trips', { destination: slug, limit: 12 }],
    queryFn: () => tripApi.list({ destination: slug, limit: 12 }),
    enabled: !!destination && !isLoading,
  })

  const trips = tripsQuery.data?.data?.data?.items || []

  useSeo({
    title: destination ? destinationSeoTitle(destination.name) : undefined,
    description: destination?.seoDescription || destination?.description?.slice(0, 160),
    canonical: destination ? `${window.location.origin}/destination/${destination.slug}` : undefined,
  })

  if (isLoading) {
    return (
      <Container className="py-10">
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        <div className="mt-6 h-8 w-1/2 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-muted" />
      </Container>
    )
  }

  if (isError || !destination) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold">Destination not found</h1>
        <p className="mt-2 text-muted-foreground">
          This destination may have been unpublished or removed.
        </p>
        <Link
          to="/destinations"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" />
          Browse destinations
        </Link>
      </Container>
    )
  }

  const hasPrice = destination.startingPrice !== null && destination.startingPrice !== undefined

  // Media fallback: heroImage -> homepageImage -> gallery[0]
  const heroMedia = destination.heroImage?.url || destination.heroImage?.secureUrl
    ? destination.heroImage
    : destination.homepageImage?.url || destination.homepageImage?.secureUrl
      ? destination.homepageImage
      : destination.gallery?.[0] || null

  const description = destination.description || ''
  const preview = getPreviewText(description)
  const needsReadMore = description && description.replace(/\s+/g, ' ').trim().length > 180

  return (
    <Container className="py-8 lg:py-12">
      <Link
        to="/destinations"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <ArrowLeft className="h-4 w-4" />
        All destinations
      </Link>

      {/* Large Destination Media */}
      <div className="mt-4 overflow-hidden rounded-2xl">
        {heroMedia ? (
          <DestinationImage
            image={heroMedia}
            alt={heroMedia.alt || destination.name}
            className="aspect-[16/7] w-full"
          />
        ) : (
          <div className="flex aspect-[16/7] w-full items-center justify-center bg-muted text-muted-foreground">
            No media yet
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {destination.name} Tour Packages
            </h1>
            {destination.featured && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                Featured
              </span>
            )}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {destination.country}
            {destination.region ? ` · ${destination.region}` : ''}
          </p>

          {/* Description preview */}
          {description ? (
            <div className="mt-4">
              <p className="line-clamp-2 text-sm leading-relaxed text-foreground/80 sm:text-base">
                {preview}
              </p>
              {needsReadMore && (
                <button
                  type="button"
                  onClick={() => setShowDescriptionModal(true)}
                  className="mt-2 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Read More
                </button>
              )}
            </div>
          ) : null}
        </div>

        {/* Price card */}
        <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-card">
          {hasPrice ? (
            <>
              <p className="text-sm text-muted-foreground">Starting at</p>
              <p className="mt-1 flex items-center text-3xl font-bold">
                <IndianRupee className="h-6 w-6" />
                {destination.startingPrice.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-muted-foreground">{destination.currency}</p>
            </>
          ) : (
            <p className="text-muted-foreground">Price on request</p>
          )}

          <Link
            to="/trips"
            className="mt-6 flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Browse trips
          </Link>

          <PlanTripTrigger
            destinationId={destination.id}
            variant="outline"
            className="mt-3 w-full"
          >
            Plan Your Dream Trip
          </PlanTripTrigger>
        </aside>
      </div>

      {/* Description Modal */}
      <DescriptionModal
        open={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        title={destination.name}
        description={description}
      />

      {/* Trips for this destination */}
      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Trips in {destination.name}</h2>
          {trips.length > 0 && (
            <Link to="/trips" className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
              View all trips
            </Link>
          )}
        </div>

        {tripsQuery.isLoading ? (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No trips available for this destination yet.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>

      {/* FAQs */}
      <DestinationFaqs slug={destination.slug} name={destination.name} />

      {/* Related destinations — same market category, real data only */}
      <RelatedDestinations category={destination.category} currentSlug={destination.slug} />

      {/* Gallery */}
      {destination.gallery && destination.gallery.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Gallery</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {destination.gallery.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGalleryIndex(i)}
                aria-label={`View image ${i + 1} of ${destination.gallery.length}`}
                className="overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <DestinationImage
                  image={img}
                  alt={img.alt || `${destination.name} ${i + 1}`}
                  className="aspect-square w-full transition-transform duration-300 hover:scale-[1.03]"
                />
              </button>
            ))}
          </div>
          {galleryIndex !== null && (
            <Lightbox
              images={destination.gallery}
              index={galleryIndex}
              onClose={() => setGalleryIndex(null)}
              onPrev={() => setGalleryIndex((i) => (i - 1 + destination.gallery.length) % destination.gallery.length)}
              onNext={() => setGalleryIndex((i) => (i + 1) % destination.gallery.length)}
            />
          )}
        </div>
      )}
    </Container>
  )
}

function DestinationFaqs({ slug, name }) {
  const { data, isLoading } = useQuery({
    queryKey: ['faqs', 'destination', slug],
    queryFn: () => faqApi.listForDestination(slug),
    enabled: !!slug,
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="mt-10">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-24 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  const items = data?.data?.data?.items || []
  if (items.length === 0) return null

  return (
    <div className="mt-10">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <HelpCircle className="h-5 w-5 text-primary" />
        FAQs about {name}
      </h2>
      <div className="mt-4">
        <Accordion items={items} />
      </div>
    </div>
  )
}

// Real destinations in the same market category (never fabricated). Hidden when
// there is no meaningful set of peers.
function RelatedDestinations({ category, currentSlug }) {
  const { data, isLoading } = useQuery({
    queryKey: ['destinations', 'related', category],
    queryFn: () => destinationApi.list({ category, limit: 8 }),
    enabled: !!category,
    staleTime: 60_000,
  })

  const related = (data?.data?.data?.items || []).filter((d) => d.slug !== currentSlug).slice(0, 4)
  if (isLoading) {
    return (
      <div className="mt-10">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }
  if (related.length < 2) return null

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Similar destinations</h2>
        <Link
          to="/destinations"
          className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          View all destinations
        </Link>
      </div>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((d) => (
          <DestinationCard key={d.id} destination={d} />
        ))}
      </div>
    </div>
  )
}
