import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import * as React from 'react'
import { ArrowLeft, HelpCircle, X } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { DestinationCard } from '@/components/destinations/DestinationCard'
import { TripCard } from '@/components/trips/TripCard'
import { Accordion } from '@/components/ui/accordion'
import { destinationApi } from '@/services/destinations'
import { tripApi } from '@/services/trips'
import { TRIP_TYPE_LABELS } from '@/schemas/trip'
import { faqApi } from '@/services/faqs'
import { useSeo, destinationSeoTitle } from '@/lib/seo'
import { createPortal } from 'react-dom'
import { sanitizeHtml, markdownToHtml } from '@/lib/sanitize'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock'

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

function getPreviewText(description, maxChars = 400) {
  if (!description) return ''
  const text = /<[a-z][\s\S]*>/i.test(description) ? stripHtml(description) : String(description).replace(/\s+/g, ' ').trim()
  if (text.length <= maxChars) return text
  const sliced = text.slice(0, maxChars)
  const lastSpace = sliced.lastIndexOf(' ')
  const truncated = lastSpace > 100 ? sliced.slice(0, lastSpace) : sliced
  return truncated + '...'
}

function getDisplayHtml(description) {
  if (!description) return ''
  const str = String(description)
  if (/<[a-z][\s\S]*>/i.test(str)) return sanitizeHtml(str)
  if (/^(#{1,4})\s+/m.test(str) || /\*\*/.test(str)) return markdownToHtml(str)
  return ''
}

function DescriptionModal({ open, onClose, title, description }) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    lockBodyScroll()
    return () => {
      document.removeEventListener('keydown', onKey)
      unlockBodyScroll()
    }
  }, [open, onClose])

  if (!open) return null

  const displayHtml = getDisplayHtml(description)
  const isRich = !!displayHtml

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
              dangerouslySetInnerHTML={{ __html: displayHtml }}
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
  const [showDescriptionModal, setShowDescriptionModal] = React.useState(false)
  const [styleFilter, setStyleFilter] = React.useState(null)

  // Reset the style filter when navigating between destinations.
  React.useEffect(() => {
    setStyleFilter(null)
  }, [slug])

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

  // Travel styles present in this destination's trips — a pill renders ONLY
  // for styles with at least one trip (derived from the canonical trip-type
  // taxonomy, same labels as the trip cards and trip filters).
  const availableStyles = [...new Set(trips.flatMap((t) => Array.isArray(t.tripType) ? t.tripType : t.tripType ? [t.tripType] : []).filter(Boolean))]
  const visibleTrips = styleFilter ? trips.filter((t) => (Array.isArray(t.tripType) ? t.tripType : t.tripType ? [t.tripType] : []).includes(styleFilter)) : trips

  useSeo({
    title: destination ? destinationSeoTitle(destination.name) : undefined,
    description: destination?.seoDescription || destination?.description?.slice(0, 160),
    canonical: destination ? `${window.location.origin}/destination/${destination.slug}` : undefined,
  })

  if (isLoading) {
    return (
      <div>
        {/* Hero skeleton — same aspect as real hero, title centered in gradient area */}
        <div className="relative w-full overflow-hidden">
          <div className="skeleton aspect-[0.7/1] w-full md:aspect-[3.17/1]" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent px-4 pb-6 pt-16 sm:pb-8">
            <div className="mx-auto flex justify-center">
              <div className="skeleton h-7 w-56 rounded-full bg-white/30 sm:h-9 sm:w-72" />
            </div>
          </div>
        </div>

        <div className="w-full px-5 pb-8 pt-[60px] sm:px-8 lg:px-[84px] lg:pb-10">
          {/* Heading — Norsy 30px simulation, Featured pill */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="skeleton h-[36px] w-[260px] rounded sm:h-[36px] sm:w-[320px]" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>

          {/* Description preview — 2-3 lines + Read More */}
          <div className="mt-4 max-w-3xl space-y-2.5">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-[88%] rounded" />
            <div className="skeleton h-4 w-[72%] rounded sm:hidden" />
            <div className="skeleton mt-2 h-4 w-20 rounded" />
          </div>

          {/* Style pills + Trip-card grid heading */}
          <div className="mt-12">
            <div className="flex flex-wrap gap-2">
              <div className="skeleton h-8 w-14 rounded-full" />
              <div className="skeleton h-8 w-20 rounded-full" />
              <div className="skeleton h-8 w-24 rounded-full" />
              <div className="skeleton h-8 w-20 rounded-full" />
            </div>
            <div className="mt-4 flex flex-wrap gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full max-w-[300px] overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <div className="skeleton aspect-[1.377/1] w-full lg:aspect-[3/2]" />
                  <div className="p-4">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="mt-2 space-y-2">
                      <div className="skeleton h-4 w-full rounded" />
                      <div className="skeleton h-4 w-[78%] rounded" />
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="skeleton h-5 w-32 rounded" />
                      <div className="skeleton h-3 w-40 rounded" />
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3">
                      <div className="skeleton h-3 w-3 rounded-full" />
                      <div className="skeleton h-3 flex-1 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs skeleton */}
          <div className="mt-10">
            <div className="skeleton h-6 w-40 rounded" />
            <div className="mt-4 space-y-2">
              <div className="skeleton h-14 w-full rounded-xl" />
              <div className="skeleton h-14 w-full rounded-xl" />
            </div>
          </div>

          {/* Related destinations */}
          <div className="mt-12">
            <div className="flex items-center justify-between">
              <div className="skeleton h-6 w-44 rounded" />
              <div className="skeleton h-4 w-24 rounded" />
            </div>
            <div className="mt-4 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="skeleton aspect-[4/3] w-full" />
                  <div className="p-3">
                    <div className="skeleton h-4 w-28 rounded" />
                    <div className="mt-2 h-3 w-20 rounded skeleton" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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

  // Media fallback: heroImage -> homepageImage -> gallery[0]
  const heroMedia = destination.heroImage?.url || destination.heroImage?.secureUrl
    ? destination.heroImage
    : destination.homepageImage?.url || destination.homepageImage?.secureUrl
      ? destination.homepageImage
      : destination.gallery?.[0] || null

  // Hero video takes precedence over the hero image when configured.
  const heroVideoSrc = destination.heroVideo?.secureUrl || destination.heroVideo?.url || ''

  const description = destination.description || ''
  let preview = getPreviewText(description)
  // Stored descriptions sometimes begin with the destination name itself (a
  // pasted heading), which tag-stripping concatenates into the preview text.
  // Strip that leading name so the preview is description-only.
  if (destination.name && preview.toLowerCase().startsWith(destination.name.toLowerCase())) {
    preview = preview
      .slice(destination.name.length)
      .replace(/^[:\-–—|]\s*/, '')
      .trimStart()
  }
  const needsReadMore = description && description.replace(/\s+/g, ' ').trim().length > 300

  return (
    <div>
      {/* Full-bleed landing hero — spans the viewport, no card, no rounding */}
      <div className="relative w-full overflow-hidden">
        {heroVideoSrc ? (
          <video
            key={heroVideoSrc}
            ref={(el) => {
              if (el) el.muted = true
            }}
            src={heroVideoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="aspect-[0.7/1] w-full object-cover md:aspect-[3.17/1]"
          />
        ) : heroMedia ? (
          <DestinationImage
            image={heroMedia}
            alt={heroMedia.alt || destination.name}
            className="aspect-[0.7/1] w-full md:aspect-[3.17/1]"
          />
        ) : (
          <div className="flex aspect-[0.7/1] w-full items-center justify-center bg-muted text-muted-foreground md:aspect-[3.17/1]">
            No media yet
          </div>
        )}
        {(heroVideoSrc || heroMedia) && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-4 pb-6 pt-16 text-center sm:pb-8">
            <p
              style={{ fontFamily: "'Bree Serif', serif" }}
              className="text-2xl font-bold tracking-tight text-white drop-shadow-md sm:text-3xl lg:text-4xl"
            >
              {destination.name}
            </p>
          </div>
        )}
      </div>

      {/* Full-width content — 60px gap below the hero, 84px desktop gutters */}
      <div className="w-full px-5 pb-8 pt-[60px] sm:px-8 lg:px-[84px] lg:pb-10">
      <div>
        <div>
          <h2
            style={{ fontFamily: "'Bree Serif', serif" }}
            className="mb-4 text-[30px] font-bold leading-[1.2] tracking-tight text-[#1E3133]"
          >
            {destination.name}
          </h2>

          {/* Description preview */}
          {description ? (
            <div className="mt-4">
              <p className="line-clamp-1 w-full text-sm leading-relaxed text-foreground/80 sm:text-base">
                {preview}
              </p>
              {needsReadMore && (
                <button
                  type="button"
                  onClick={() => setShowDescriptionModal(true)}
                  className="mt-2 text-sm font-normal text-blue-600 underline underline-offset-2 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Read More
                </button>
              )}
            </div>
          ) : null}
        </div>
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
        {tripsQuery.isLoading ? (
          <div className="mt-4 flex flex-wrap gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 w-full max-w-[300px] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No trips available for this destination yet.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-8">
            {visibleTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>

      {/* FAQs */}
      <DestinationFaqs slug={destination.slug} name={destination.name} />

      {/* Related destinations — same market category, real data only */}
      <RelatedDestinations category={destination.category} currentSlug={destination.slug} />
      </div>
    </div>
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
        <div className="mt-4 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="mt-4 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((d) => (
          <DestinationCard key={d.id} destination={d} />
        ))}
      </div>
    </div>
  )
}
