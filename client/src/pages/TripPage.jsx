import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { MapPin, CalendarDays, Users, ArrowLeft, Clock, HelpCircle, Star, X, ChevronDown, Download, Minus, Plus, Check } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { Accordion } from '@/components/ui/accordion'
import { TripCard } from '@/components/trips/TripCard'
import { TravelerGallery } from '@/components/trips/TravelerGallery'
import { tripApi } from '@/services/trips'
import { publicWhatsappApi } from '@/services/settings'
import { DEFAULT_WHATSAPP } from '@/lib/settings'
import { tripBatchApi } from '@/services/tripBatches'
import { TripDepartures } from '@/components/trips/TripDepartures'
import { TripTravellerReviews } from '@/components/trips/TripTravellerReviews'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { PlanTripTrigger } from '@/components/enquiry/PlanTripTrigger'
import { TripReviews } from '@/components/trips/TripReviews'
import { faqApi } from '@/services/faqs'
import { useSeo, tripSeoTitle } from '@/lib/seo'
import { TRIP_TYPE_LABELS } from '@/schemas/trip'
import { formatDateShort } from '@/lib/dates'

// "What's in the Package?" editorial list: items ending in ":" render as bold
// group headings, everything else as spaced bullet rows. Data untouched.
function PackageList({ items }) {
  if (!items || items.length === 0) {
    return <p className="text-[15px] text-muted-foreground">No items listed.</p>
  }
  return (
    <ul className="space-y-[18px]">
      {items.map((item, i) => {
        const text = String(item || '').trim()
        if (!text) return null
        if (/:$/.test(text)) {
          return (
            <li key={i} className="pt-2 text-[15px] font-bold leading-7 text-gray-900 first:pt-0">
              {text}
            </li>
          )
        }
        return (
          <li key={i} className="flex items-start gap-2.5 text-[15px] leading-7 text-gray-900">
            <span aria-hidden="true" className="select-none">•</span>
            <span>{text}</span>
          </li>
        )
      })}
    </ul>
  )
}

function stripHtml(html) {
  if (!html) return ''
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

function DescriptionModal({ open, onClose, title, description }) {
  React.useEffect(() => {
    if (!open) return undefined
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
          <h2 className="pr-8 text-base font-semibold sm:text-lg">{title}</h2>
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

export function TripPage() {
  const { slug } = useParams()
  const [showDescriptionModal, setShowDescriptionModal] = React.useState(false)
  const [openDay, setOpenDay] = React.useState(null)
  // Booking-card selection: month filter, chosen departure, traveller count.
  const [selectedMonth, setSelectedMonth] = React.useState(null)
  const [selectedKey, setSelectedKey] = React.useState(null)
  const [travellers, setTravellers] = React.useState(1)

  React.useEffect(() => {
    setSelectedMonth(null)
    setSelectedKey(null)
    setTravellers(1)
  }, [slug])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['trips', 'slug', slug],
    queryFn: () => tripApi.getBySlug(slug),
    retry: false,
  })

  const trip = data?.data?.data

  // Upcoming departures loaded once and shared with the departures section and
  // the sticky booking card (no duplicate requests).
  const batchesQuery = useQuery({
    queryKey: ['trip-batches', trip?.id],
    queryFn: () => tripBatchApi.listByTrip(trip.id),
    retry: false,
    staleTime: 30_000,
    enabled: !!trip,
  })
  const upcomingBatches = batchesQuery.data?.data?.data?.items || []

  // Real display pricing: the cheapest upcoming public departure wins (matches
  // the discovery cards); Trip.startingPrice is only the fallback when no
  // departure is scheduled yet. Never fabricated.
  const cheapestBatch = upcomingBatches.length
    ? upcomingBatches.reduce((min, b) => (Number(b.price) < Number(min.price) ? b : min), upcomingBatches[0])
    : null

  // Trip-level discount (selling vs MRP), shown only when genuinely discounted.
  const tripDiscount =
    trip?.originalPrice != null &&
    trip?.startingPrice != null &&
    Number(trip.originalPrice) > Number(trip.startingPrice)
      ? Number(trip.originalPrice) - Number(trip.startingPrice)
      : null
  const sellingPrice = cheapestBatch ? Number(cheapestBatch.price) : (trip?.startingPrice ?? null)
  const headerOriginal = cheapestBatch
    ? cheapestBatch.originalPrice != null && Number(cheapestBatch.originalPrice) > Number(cheapestBatch.price)
      ? Number(cheapestBatch.originalPrice)
      : null
    : tripDiscount != null
      ? Number(trip.originalPrice)
      : null
  const headerDiscount = cheapestBatch
    ? cheapestBatch.discountAmount != null && Number(cheapestBatch.discountAmount) > 0
      ? Number(cheapestBatch.discountAmount)
      : null
    : tripDiscount

  // Booking-card departures: dated batch inventory when present, otherwise the
  // admin-entered trip departure dates (priced at the selling price). Real data
  // only — never fabricated.
  const toDateOnly = (v) => String(v || '').slice(0, 10)
  const batchOptions = upcomingBatches
    .filter((b) => toDateOnly(b.departureDate))
    .map((b) => ({ key: `batch:${b.id}`, date: b.departureDate, price: Number(b.price), batch: b }))
  const tripDateOptions = (trip?.departures || [])
    .map((d) => toDateOnly(d))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .map((d) => ({ key: `trip:${d}`, date: d, price: sellingPrice, batch: null }))
  const dateOptions = batchOptions.length > 0 ? batchOptions : tripDateOptions
  const months = [...new Set(dateOptions.map((o) => toDateOnly(o.date).slice(0, 7)))]
  const activeMonth = selectedMonth && months.includes(selectedMonth) ? selectedMonth : months[0]
  const monthOptions = dateOptions.filter((o) => toDateOnly(o.date).slice(0, 7) === activeMonth)
  const selectedOption = monthOptions.find((o) => o.key === selectedKey) || monthOptions[0] || null
  const monthLabel = (ym) => formatDateShort(`${ym}-01`).split(' ')[0]
  const selectedSoldOut =
    selectedOption?.batch?.availableSeats != null && Number(selectedOption.batch.availableSeats) <= 0
  const maxTravellers =
    selectedOption?.batch?.availableSeats > 0 ? Number(selectedOption.batch.availableSeats) : 10

  // WhatsApp contact pill — same admin-managed configuration as the floating
  // button (hidden when disabled or unconfigured).
  const { data: whatsappData } = useQuery({
    queryKey: ['settings', 'whatsapp', 'public'],
    queryFn: async () => {
      try {
        const res = await publicWhatsappApi.get()
        return res.data?.data ?? null
      } catch {
        return null
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
  const waEnabled = typeof whatsappData?.enabled === 'boolean' ? whatsappData.enabled : DEFAULT_WHATSAPP.enabled
  const waDigits = String(
    whatsappData?.phoneNumber != null ? whatsappData.phoneNumber : DEFAULT_WHATSAPP.phoneNumber
  ).replace(/\D/g, '')
  const waMessage = typeof whatsappData?.prefilledMessage === 'string'
    ? whatsappData.prefilledMessage
    : DEFAULT_WHATSAPP.prefilledMessage
  const waHref = waEnabled && waDigits
    ? `https://wa.me/${waDigits}${waMessage ? `?text=${encodeURIComponent(waMessage)}` : ''}`
    : null

  useSeo({
    title: trip ? tripSeoTitle(trip.name) : undefined,
    description: trip?.seoDescription || trip?.shortDescription,
    canonical: trip ? `${window.location.origin}/trip/${trip.slug}` : undefined,
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

  if (isError || !trip) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold">Trip not found</h1>
        <p className="mt-2 text-muted-foreground">This trip may have been unpublished or removed.</p>
        <Link
          to="/trips"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" />
          Browse trips
        </Link>
      </Container>
    )
  }

  // Hero media: dedicated hero video wins, else the dedicated hero image.
  const heroVideoSrc = trip.heroVideo?.secureUrl || trip.heroVideo?.url || ''
  // Overlay uses the Trip Card Name; the content heading uses the Trip Page
  // Heading. Each falls back to the canonical name for legacy trips only.
  const overlayName = trip.cardName || trip.name
  const contentHeading = trip.pageHeading || trip.name

  return (
    <div>
      <Container className="py-3">
        <Link
          to="/trips"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <ArrowLeft className="h-4 w-4" />
          All trips
        </Link>
      </Container>

      {/* Full-bleed hero — same sizing/behavior as the destination hero */}
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
        ) : (
          <DestinationImage
            src={trip.heroImage?.url}
            alt={trip.heroImage?.alt || overlayName}
            className="aspect-[0.7/1] w-full md:aspect-[3.17/1]"
          />
        )}
        <WishlistButton type="trip" id={trip.id} className="absolute right-3 top-3" size={40} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-4 pb-6 pt-16 text-center sm:pb-8">
          <p className="text-2xl font-bold tracking-tight text-white drop-shadow-md sm:text-3xl lg:text-4xl">
            {overlayName}
          </p>
        </div>
      </div>

      <div className="w-full px-5 py-8 sm:px-8 lg:px-[84px] lg:py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{contentHeading}</h1>
            {trip.featured && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                Featured
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {trip.destination && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <Link to={`/destination/${trip.destination.slug}`} className="hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                  {trip.destination.name}
                </Link>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {trip.durationDays} Days / {trip.durationNights} Nights
            </span>
            <span className="inline-flex items-center gap-1.5 capitalize">
              <Clock className="h-4 w-4" />
              {TRIP_TYPE_LABELS[trip.tripType] || trip.tripType}
            </span>
            {trip.maxGroupSize > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Max {trip.maxGroupSize}
              </span>
            )}
          </div>

          {/* Description preview — one line + Read More, like the destination page */}
          {(() => {
            const source = trip.description || trip.shortDescription || ''
            let preview = getPreviewText(source)
            const label = trip.cardName || trip.name
            if (label && preview.toLowerCase().startsWith(label.toLowerCase())) {
              preview = preview.slice(label.length).replace(/^[:\-–—|]\s*/, '').trimStart()
            }
            const needsMore = source.replace(/\s+/g, ' ').trim().length > 300
            if (!source) return null
            return (
              <div className="mt-4">
                <p className="line-clamp-1 w-full text-sm leading-relaxed text-foreground/80 sm:text-base">
                  {preview}
                </p>
                {needsMore && (
                  <button
                    type="button"
                    onClick={() => setShowDescriptionModal(true)}
                    className="mt-2 text-sm font-normal text-blue-600 underline underline-offset-2 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    Read More
                  </button>
                )}
                <DescriptionModal
                  open={showDescriptionModal}
                  onClose={() => setShowDescriptionModal(false)}
                  title={label}
                  description={source}
                />
              </div>
            )
          })()}

          {/* Upcoming departures with real batch pricing/availability */}
          <div className="mt-10">
            <TripDepartures
              trip={trip}
              batches={upcomingBatches}
              isLoading={batchesQuery.isLoading}
              isError={batchesQuery.isError}
            />
          </div>

          {/* Itinerary — reference-style accordion: gray collapsed rows,
              mint expanded row, "Day N" outline pills, chevron toggles.
              First day open by default. */}
          {trip.itinerary && trip.itinerary.length > 0 && (
            <div className="mt-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[28px] font-extrabold leading-tight tracking-tight">Itinerary Breakdown</h2>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download Itinerary
                </button>
              </div>
              <div className="mt-5 space-y-3">
                {trip.itinerary.map((day, idx) => {
                  // openDay: null = default (first day open), a day number =
                  // explicit choice, false = all closed. The old `??` fallback
                  // made closing any day reopen day 1 instead.
                  const activeDay = openDay === null ? trip.itinerary[0]?.dayNumber : openDay
                  const isOpen = activeDay === day.dayNumber
                  const cleanTitle = String(day.title || `Day ${day.dayNumber}`)
                    .replace(/^\s*DAY\s*\d+\s*[:|\-–—]?\s*/i, '')
                    .trim()
                  return (
                    <div
                      key={`${day.dayNumber}-${idx}`}
                      className={`overflow-hidden rounded-xl border transition-colors ${
                        isOpen ? 'border-emerald-100 bg-[#edfaf1]' : 'border-border bg-[#f4f4f5]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenDay(isOpen ? false : day.dayNumber)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        <span className="inline-flex shrink-0 items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-700">
                          Day {day.dayNumber}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold uppercase tracking-wide text-gray-900">
                          {cleanTitle || `Day ${day.dayNumber}`}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-gray-700 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-6 text-[15px] leading-8 text-gray-800 sm:px-5">
                          {day.description && (
                            <div
                              className="prose prose-sm max-w-none break-words prose-p:my-2 prose-ul:list-disc prose-ol:list-decimal prose-li:my-1"
                              dangerouslySetInnerHTML={{ __html: day.description }}
                            />
                          )}
                          {day.activities?.length > 0 && (
                            <ul className="mt-1 space-y-2">
                              {day.activities.map((a, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span aria-hidden="true">•</span>
                                  <span>{a}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {day.meals?.length > 0 && (
                            <p className="mt-1"><span className="font-medium">Meals:</span> {day.meals.join(', ')}</p>
                          )}
                          {day.accommodation && (
                            <p className="mt-1"><span className="font-medium">Stay:</span> {day.accommodation}</p>
                          )}
                          {day.notes && <p className="mt-1">{day.notes}</p>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* What's in the Package? — Included / Not Included editorial columns */}
          {(trip.inclusions?.length > 0 || trip.exclusions?.length > 0) && (
            <div className="mt-10">
              <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-gray-900">
                What&apos;s in the Package?
              </h2>
              <div
                className={`mt-6 grid gap-x-12 gap-y-8 ${
                  trip.inclusions?.length > 0 && trip.exclusions?.length > 0 ? 'sm:grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {trip.inclusions?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Included</h3>
                    <div className="mt-4">
                      <PackageList items={trip.inclusions} />
                    </div>
                  </div>
                )}
                {trip.exclusions?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Not Included</h3>
                    <div className="mt-4">
                      <PackageList items={trip.exclusions} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Costing — room-sharing table, only when rows exist */}
          {trip.costing?.length > 0 && (
            <div className="mt-10">
              <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-gray-900">
                Costing
              </h2>
              <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
                <table className="w-full border-collapse text-center">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th scope="col" className="w-1/2 border-r border-gray-200 px-4 py-3.5 text-sm font-bold text-gray-900">
                        Mode
                      </th>
                      <th scope="col" className="w-1/2 px-4 py-3.5 text-sm font-bold text-gray-900">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {trip.costing.map((row, i) => (
                      <tr key={i}>
                        <td className="border-r border-gray-200 px-4 py-4 text-sm text-gray-900">
                          {row.mode || '—'}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          {row.price != null ? `₹ ${Number(row.price).toLocaleString('en-IN')}` : '—'}
                          {row.originalPrice != null && (
                            <span className="ml-2 text-[13px] font-normal text-muted-foreground line-through">
                              ₹ {Number(row.originalPrice).toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes — clean editorial list treatment (data untouched) */}
          {trip.importantInformation && (
            <div className="mt-10">
              <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-gray-900">Notes</h2>
              <div
                className="prose mt-5 max-w-none break-words text-[15px] font-normal leading-8 text-gray-900 prose-headings:font-bold prose-p:my-4 prose-ul:my-4 prose-ul:space-y-4 prose-ul:pl-5 prose-ol:my-4 prose-ol:space-y-4 prose-ol:pl-5 prose-li:my-2 prose-li:pl-1 prose-strong:font-semibold prose-a:text-primary prose-a:underline [&_br]:mb-4 [&_br]:block"
                dangerouslySetInnerHTML={{ __html: trip.importantInformation }}
              />
            </div>
          )}

          {/* Reviews & ratings (approved only, verified bookings) */}
          <div className="mt-10">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden="true" />
              Ratings &amp; Reviews
            </h2>
            <div className="mt-4">
              <TripReviews trip={trip} />
            </div>
          </div>

          {/* FAQs - CMS-managed (trip → destination → global) */}
          <TripFaqs slug={trip.slug} name={trip.name} />

          {/* FAQs saved on the trip itself (admin Trip form) */}
          <TripEmbeddedFaqs
            faqs={trip.faqs}
            headingName={trip.destination?.name || trip.cardName || trip.name}
          />

          {/* Gallery by Travelers — Photos/Videos tabs */}
          <TravelerGallery tripId={trip.id} tripName={trip.name} />

          {/* Admin-curated reviews for this trip only */}
          <TripTravellerReviews trip={trip} />

          {/* Related trips — same destination */}
          <RelatedTrips trip={trip} />
        </div>

        {/* Booking card — reference hierarchy: price header, trip dates,
            travellers, Book Now, WhatsApp. All values from real trip data. */}
        <aside className="h-fit rounded-xl border border-border bg-card p-5 shadow-card sm:p-6 lg:sticky lg:top-24">
          <p className="text-[13px] font-medium text-muted-foreground">Trip Starts From</p>
          {sellingPrice != null ? (
            <>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[28px] font-extrabold leading-none text-primary">
                ₹{Number(sellingPrice).toLocaleString('en-IN')}
                {headerOriginal != null && (
                  <span className="text-sm font-normal text-muted-foreground line-through">
                    ₹{Number(headerOriginal).toLocaleString('en-IN')}
                  </span>
                )}
                {headerDiscount != null && (
                  <span className="text-sm font-semibold text-red-600">
                    ₹{Number(headerDiscount).toLocaleString('en-IN')} Off
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Per Person</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Price on request</p>
          )}

          {trip.datesOnRequest ? (
            <div className="mt-5">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <span aria-hidden="true">📅</span> Trip Dates
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Dates on Request</p>
            </div>
          ) : dateOptions.length > 0 ? (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <span aria-hidden="true">📅</span> Trip Dates
                </p>
                {months.length > 1 ? (
                  <select
                    aria-label="Filter departures by month"
                    value={activeMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value)
                      setSelectedKey(null)
                    }}
                    className="rounded-full border border-input bg-background px-3 py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>{monthLabel(m)}</option>
                    ))}
                  </select>
                ) : null}
              </div>
              <ul className="mt-3 space-y-2">
                {monthOptions.map((o) => {
                  const active = selectedOption?.key === o.key
                  return (
                    <li key={o.key}>
                      <button
                        type="button"
                        onClick={() => setSelectedKey(o.key)}
                        aria-pressed={active}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          active ? '' : 'hover:bg-muted/50'
                        }`}
                      >
                        <span>
                          <span className="block text-[15px] font-semibold">
                            {formatDateShort(o.date).replace(/(\w+) (\d+)/, '$2 $1')} {toDateOnly(o.date).slice(0, 4)}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            Starting ₹{Number(o.price).toLocaleString('en-IN')} /Person
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                            active ? 'bg-foreground text-background' : 'border border-input'
                          }`}
                        >
                          {active && <Check className="h-3 w-3" />}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <span aria-hidden="true">👥</span> No. of Travellers
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Remove a traveller"
                disabled={travellers <= 1}
                onClick={() => setTravellers((n) => Math.max(1, n - 1))}
                className="grid h-7 w-7 place-items-center rounded-full text-lg leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span aria-live="polite" aria-label={`${travellers} travellers selected`} className="min-w-[1.5rem] text-center text-[15px] font-semibold">
                {travellers}
              </span>
              <button
                type="button"
                aria-label="Add a traveller"
                disabled={travellers >= maxTravellers}
                onClick={() => setTravellers((n) => Math.min(maxTravellers, n + 1))}
                className="grid h-7 w-7 place-items-center rounded-full text-lg leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {selectedOption?.batch && !selectedSoldOut ? (
            <Link
              to={`/booking/${trip.slug}?batch=${selectedOption.batch.id}&travellers=${travellers}`}
              className="mt-5 flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Book Now
            </Link>
          ) : selectedSoldOut ? (
            <p className="mt-5 rounded-full border border-border bg-background px-4 py-3 text-center text-xs font-medium text-muted-foreground">
              Sold out on this departure — try another date
            </p>
          ) : (
            trip.destination?.id && (
              <PlanTripTrigger
                destinationId={trip.destination.id}
                variant="outline"
                className="mt-5 w-full rounded-full"
              >
                Plan Your Dream Trip
              </PlanTripTrigger>
            )
          )}

          {waHref && (
            <p className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground">
              Any Doubt?
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <img src="/whatappNew.svg" alt="" aria-hidden="true" className="h-4 w-4" draggable={false} />
                WhatsApp
              </a>
            </p>
          )}
        </aside>
      </div>
      </div>
    </div>
  )
}

function RelatedTrips({ trip }) {
  const { data, isLoading } = useQuery({
    queryKey: ['trips','related',trip.destination?.slug, trip.id],
    queryFn: () => tripApi.list({ destination: trip.destination?.slug, limit: 4, includeBatches: true }),
    enabled: !!trip.destination?.slug,
    staleTime: 60_000,
  })
  const related = (data?.data?.data?.items || []).filter(t => t.id !== trip.id).slice(0, 3)
  if (isLoading) return null
  if (related.length === 0) return null
  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">More trips in {trip.destination?.name}</h2>
        <Link to="/trips" className="text-sm font-medium text-primary hover:underline">View all trips</Link>
      </div>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.map(t => <TripCard key={t.id} trip={t} />)}
      </div>
    </div>
  )
}

// FAQs stored directly on the trip (admin Trip form), rendered in the
// reference style: gray rounded container, question rows with chevrons,
// all closed by default. Hidden when the trip has no FAQs.
function TripEmbeddedFaqs({ faqs, headingName }) {
  const [openIndex, setOpenIndex] = React.useState(null)
  const items = Array.isArray(faqs) ? faqs.filter((f) => f && (f.question || f.answer)) : []

  if (items.length === 0) return null

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[26px]">
        {headingName} Frequently Asked Questions
      </h2>
      <div className="mt-5 rounded-2xl bg-[#f4f4f5] px-5 py-2 sm:px-7">
        {items.map((faq, i) => {
          const isOpen = openIndex === i
          return (
            <div key={i} className={i > 0 ? 'border-t border-gray-200' : undefined}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="text-[15px] font-medium text-gray-900">{faq.question}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <p className="whitespace-pre-line pb-5 pr-8 text-sm leading-relaxed text-gray-700">
                  {faq.answer}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TripFaqs({ slug, name }) {
  const { data, isLoading } = useQuery({
    queryKey: ['faqs', 'trip', slug],
    queryFn: () => faqApi.listForTrip(slug),
    enabled: !!slug,
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="mt-10">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
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
