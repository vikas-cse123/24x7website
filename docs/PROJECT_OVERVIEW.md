# PROJECT_OVERVIEW

The eventual **24x7Chhutti** product: a production-quality travel-commerce
website. Customers can discover travel destinations, browse trip packages
(including individual departure batches with their own pricing), and book trips
online.

This document describes the **planned** product. Almost nothing is implemented
yet. Every section is marked **PLANNED** unless stated otherwise.

> Functionally inspired by modern travel platforms in spirit only. No proprietary
> source code, assets, branding, text, or reviews are copied. The implementation
> is entirely our own.

---

## Feature map

### Homepage — IMPLEMENTED
Capture A Trip-style homepage: promotional bar, hero with search (→ `/trips?search=`),
community/social-proof strip (no fabricated numbers), Explore Destinations with
category tabs, Upcoming Group Trips carousel, Book with Confidence, Reasons/USPs,
Trending Destinations, Reviews/FAQ/community-moments/blogs/video placeholders.
All data comes from the real Destination and Trip APIs; no fake business content.

### Destinations — PLANNED
Public catalogue of travel destinations with name, slug, cover image, short
description, and SEO metadata. Managed via admin/CMS.

### Trip catalogue — IMPLEMENTED
`/trips` is a Capture A Trip-style discovery page: server-side search (name /
code / destination), destination tabs, trip-type filter, domestic/international
filter, budget and departure-date filters resolved against real TripBatch
pricing, four sort modes, removable filter chips, shareable URLs, pagination,
and loading/error/empty states. All filtering runs in MongoDB; the client never
downloads the whole catalogue.

### Trip detail pages — IMPLEMENTED
Full trip page: description, itinerary (day-by-day), inclusions/exclusions,
gallery, FAQs, plus a real "Upcoming departures" section driven by TripBatch
(dates, duration, price/original/discount, seats available, status) with a
"booking coming soon" call to action. Reviews appear once the Review milestone
lands.

### Trip batches — IMPLEMENTED
Each trip has one or more **`TripBatch`** records, one per departure date, each
with its own:
- departure / return dates (date-only, UTC-midnight storage — no timezone drift)
- batch-specific price (+ optional original price; discount derived)
- total/booked seats (availability derived, never stored state)
- booking window and status (`draft|open|full|closed|cancelled|completed`)

Batches are independently manageable in the admin. Only published, open/full,
future departures are visible publicly. Deleting a batch with booked seats is
blocked. See ADR-014 for the date strategy.

### Search — PLANNED
Search across destinations and trips by keyword (title, destination, tags).

### Filters — PLANNED
Filters for trip listing: destination, duration, price range, and departure
month/date.

### Booking — IMPLEMENTED (payment pending)
A guided flow modelled on the reference journey:
1. Select a trip and a specific departure batch/date.
2. Choose traveller count (capped by live availability).
3. Enter traveller details and booking contact.
4. Review a clearly-labelled pricing estimate.
5. Confirm — seats reserved atomically, snapshot stored, "Payment pending".
6. Private confirmation page at /booking/BK-xxxxxx (noindex).
Razorpay payment collection lands in the next phase.

### Enquiries — PLANNED
Contact/quote request form; captured and managed by staff.

### Customers — IMPLEMENTED (core)
Authenticated customers get a Capture A Trip-style account area at `/account`:
profile editing (name/email), My Bookings (filters, pagination, detail with the
immutable price snapshot, cancellation) and saved travellers that prefill the
booking wizard. Wishlist/notifications remain PLANNED.

### Reviews — IMPLEMENTED
Verified booking-based reviews with moderation, rating summaries, trip-page and My Account sections, and admin management (ADR-019).

### Blogs — IMPLEMENTED
Published travel articles with category/destination browsing, search, detail with structured blocks and related posts, homepage carousel, and admin editor (ADR-020).

### FAQs — IMPLEMENTED
Frequently asked questions, linked to trips or global, managed via CMS.

### Admin/CMS — PLANNED
Dashboard and management UI for destinations, trips, batches, bookings,
customers, enquiries, reviews, blogs, FAQs, coupons, media, users, and settings.
See `ADMIN.md`. FAQ CMS is also live; gallery/media remain PLANNED.

### Payments — PLANNED
Razorpay integration: create order, client-side checkout, server-side
verification, payment status tracking.

### Media — PLANNED
Image/media uploads via Multer + Cloudinary; media library for reuse across
trips, destinations, and blogs.

### SEO — PLANNED
Server-rendered/structured metadata for public pages, semantic HTML, sitemap,
robots, Open Graph, canonical URLs.

### Analytics — PLANNED
Usage analytics and error monitoring integrated at production stage.

---

## Status summary

| Feature         | Status    |
| --------------- | --------- |
| Foundation      | IMPLEMENTED (dev environment, docs, health endpoint) |
| Authentication  | IMPLEMENTED (mobile OTP login/signup; JWT in HTTP-only cookie) |
| Design system   | IMPLEMENTED (tokens, layout, header, nav, footer, routing shell) |
| Homepage        | IMPLEMENTED (Capture A Trip-style homepage from real data, incl. real departure dates/batch pricing) |
| Destinations    | IMPLEMENTED (CRUD, public listing + detail pages, SEO, publishing) |
| Trips           | IMPLEMENTED (CRUD, itinerary, inclusions/exclusions, FAQs, public pages, SEO) |
| Trip batches    | IMPLEMENTED (departure CRUD, batch pricing, capacity/availability, status workflow, public visibility rules) |
| Search/Filters  | IMPLEMENTED (batch-aware budget/date filters, server search/sort/pagination; faceted counts later) |
| Booking         | IMPLEMENTED (seats, snapshots, idempotency, cancellation; payments PLANNED) |
| Enquiries       | PLANNED |
| Customers       | IMPLEMENTED (account area: profile, my bookings, saved travellers) |
| Reviews         | IMPLEMENTED (verified-booking reviews, moderation, rating summaries) |
| Blogs            | IMPLEMENTED (public discovery + detail + admin editor; FAQs below) |
| Wishlist         | IMPLEMENTED (trip & destination)
| Notifications    | IMPLEMENTED (booking/departure/review events, header bell, account page)
| Capture A Trip UX | IMPLEMENTED (real nav, real homepage reviews, destination tabs, related trips, hero imagery, FAQs page) |
| FAQs             | IMPLEMENTED (global/destination/trip, priority merge, admin CMS) |
| Admin/CMS       | IMPLEMENTED for destinations/trips/trip-batches + dashboard; remaining sections PLANNED |
| Payments        | PLANNED |
| Media           | PLANNED |
| SEO/Analytics   | PLANNED |

See `docs/ROADMAP.md` for the phased plan and `docs/CURRENT_STATE.md` for the
authoritative current status.
