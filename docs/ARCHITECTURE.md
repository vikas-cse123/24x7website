# ARCHITECTURE

This document describes the architecture of **24x7Chhutti**. The system is a
separated frontend and backend connected over a REST API.

## High-level flow

```
React + Vite
    ↓
React Router
    ↓
TanStack Query / Axios (centralized client services)
    ↓
Express REST API
    ↓
Controllers
    ↓
Services (business logic)
    ↓
Mongoose (data access)
    ↓
MongoDB
```

## Layer responsibilities

### client (`client/`)
React single-page application (Vite). Owns UI, routing, client state, and
server-state fetching. It communicates with the backend **only** through REST
APIs. It never talks to MongoDB directly and contains minimal business logic.

- `src/routes/` — React Router configuration (`AppRoutes`, `PublicLayout`
  parent route with nested public pages). **Phase 20**: route-level `React.lazy` + `Suspense` + `manualChunks` for production performance.
- `src/pages/` — route-level page components (home shell, placeholder pages).
- `src/components/` — reusable components (`ui/`, `layout/`, `auth/`, `brand/`).
  `layout/` holds the public shell: `PublicLayout`, `Header`, `SiteNav`,
  `HeaderSearch`, `HeaderAuth`, `MobileNav`, `Footer`.
- `src/hooks/` — custom React hooks (including TanStack Query hooks).
- `src/services/` — **centralized** API layer (axios `httpClient` + per-domain
  API modules).
- `src/stores/` — Zustand stores: `auth` (session) and `ui` (overlay state).
- `src/schemas/` — Zod schemas for forms.
- `src/lib/` — utilities (`cn`, query client, `nav` config, `seo` with OG/Twitter).
- `public/robots.txt`, `public/sitemap.xml` — SEO: static public URLs only (Phase 20).

### server (`server/`)
Node.js + Express REST API. Owns all business logic and all data access.

- `src/routes/` — Express routers: map URL paths to controller methods.
- `src/controllers/` — thin HTTP layer: parse request, call a service, build the
  HTTP response. No business logic.
- `src/services/` — business logic. Encapsulate rules, orchestration, and data
  access via models.
- `src/models/` — Mongoose schemas/models.
- `src/middleware/` — cross-cutting concerns: auth, error handling, validation,
  CORS, etc.
- `src/validators/` — request input validation (Zod).
- `src/config/` — environment, database connection, app setup.
- `src/utils/` — shared helpers (e.g. token signing, validation helper).

### shared (`shared/`)
Code intended to be shared between client and server (e.g. shared constants or
Zod schemas used for validation on both sides). Kept minimal; only add when there
is genuine duplication to avoid.

### Relationship rules

- Frontend and backend remain **separated**.
- React communicates with Express through **REST APIs**.
- **Business logic lives in backend services.**
- **Database access lives in the backend** (Mongoose), never in the frontend.
- React components should not contain large amounts of business logic.
- Build reusable components and avoid duplicated business logic.

## Communication contract

- REST over JSON.
- Consistent response envelope:
  - Success: `{ "success": true, "data": ..., "message": "..." }`
  - Error: `{ "success": false, "message": "...", "errors": [...] }`
- Inputs are validated server-side (`validators/`).
- Errors are handled consistently (error-handling middleware).

## Design principles

1. Prefer simple, established solutions.
2. Avoid unnecessary abstraction.
3. Validate API inputs.
4. Handle API errors consistently.
5. Never hardcode secrets; use environment variables; keep `.env.example`
   updated.
6. Consider responsive design, accessibility, and SEO from the beginning.
7. Do not rewrite working code unnecessarily.
8. Do not make architectural changes without documenting them in
   `docs/DECISIONS.md`.

## Authentication architecture

Authentication uses a mobile-number OTP flow. See `docs/AUTHENTICATION.md` for
the full design. Key points:

- Client → `POST /api/auth/send-otp` → `POST /api/auth/verify-otp` → server sets
  an HTTP-only cookie with a JWT.
- Business logic (OTP lifecycle, find-or-create user, JWT issuance) lives in
  `server/src/services/auth.service.js` and `server/src/services/otp.service.js`.
- The `otp.service.js` is a development/mock implementation, designed to be
  replaced by a real SMS provider later without changing the rest of the flow.
- Protected routes use `requireAuth` middleware (`server/src/middleware/auth.js`).
- The frontend restores/derives its session via `GET /api/auth/me` and a Zustand
  auth store (`client/src/stores/auth.js`) exposed through `useAuth()`.
- The existing `LoginModal` is mounted once inside `PublicLayout` and driven by a
  UI store (`client/src/stores/ui.js`), so any component (e.g. the header's
  "Login / Sign Up" button) can open the same modal.

## Public website shell

```
App
 └─ PublicLayout (client/src/components/layout/PublicLayout.jsx)
     ├─ Header        (logo, HeaderSearch, SiteNav, HeaderAuth, hamburger)
     ├─ main → <Outlet/>   (current public page)
     ├─ Footer
     └─ LoginModal   (mounted once; opened via ui store)
```

- Route architecture is defined in `client/src/routes/index.jsx` under a single
  `PublicLayout` parent route (see `docs/DESIGN_SYSTEM.md` for the route list).
- Navigation is driven by a central config (`client/src/lib/nav.js`).
- Responsive behavior: desktop `SiteNav` (lg+), mobile `MobileNav` drawer
  (<lg). No horizontal overflow; keyboard accessible.

## Admin architecture (RBAC)

```
Public Routes   → PublicLayout
Admin Routes    → RequireAdmin (frontend UX guard)
                  → AdminLayout (AdminSidebar + AdminHeader + main/Outlet)
Backend /api/admin/* → requireAuth → requireRole('admin') → controller → service
```

- Roles: `user`, `staff`, `admin` (`server/src/utils/roles.js`). `user` cannot
  access `/admin`; `admin` can; `staff` is represented for later granular
  permissions.
- The **backend is the security boundary**: every admin API route is protected by
  `requireAuth` + `requireRole` in `server/src/middleware/auth.js`. Roles are read
  from the server-verified user (loaded from DB by the JWT `sub`), never from the
  client.
- Frontend `RequireAdmin` (`client/src/components/admin/RequireAdmin.jsx`) is UX
  only — it redirects unauthenticated/non-admin users to `/`.
- Admin UI: `AdminLayout`, `AdminSidebar` (nav driven by `lib/adminNav.js`),
  `AdminHeader`, `AdminDashboard` (fetches `/api/admin/dashboard`). Unbuilt
  sections render `AdminPlaceholderPage`. See `docs/ADMIN.md`.

## Destination system

```
Public:  GET /api/destinations            → published only (pagination + filters)
         GET /api/destinations/:slug      → published only (404 if draft/missing)
Admin:   /api/admin/destinations/*        → requireAuth + requireRole('admin')
```

- Model: `server/src/models/Destination.js` (see `docs/DATABASE.md`).
- Slugs: generated by `server/src/utils/slugify.js` (URL-safe, lowercase,
  unique — a numeric suffix is appended on collision). On update the slug is
  preserved unless explicitly provided.
- Publishing: `published` boolean. Drafts are editable in admin but never
  exposed through public APIs.
- Services: `server/src/services/destination.service.js` (public + admin).
  Controllers/routes split between public (`destination.*`) and admin
  (`adminDestination.*`).
- Frontend:
  - Public pages `pages/DestinationsPage.jsx` and `pages/DestinationPage.jsx`
    with a reusable `components/destinations/DestinationCard.jsx` and
    `DestinationImage.jsx` (graceful fallback).
  - Admin: `pages/admin/AdminDestinationsPage.jsx` (list with publish/unpublish/
    delete + confirmation), `pages/admin/AdminDestinationFormPage.jsx` (create/
    edit via shared `components/admin/DestinationForm.jsx`).
  - Centralized services: `client/src/services/destinations.js`
    (`destinationApi` public, `adminDestinationApi` admin).
  - SEO: `client/src/lib/seo.js` (`useSeo` sets title/meta description/
    canonical dynamically from destination data).
- Dashboard destination count is now real (`admin.service.js`).

## Trip system

```
Public:  GET /api/trips            → published only (pagination + destination/tripType/featured filters)
         GET /api/trips/:slug      → published only (404 if draft/missing)
Admin:   /api/admin/trips/*        → requireAuth + requireRole('admin')
Destination → Trip (destinationId ref) → TripBatch (future) → Booking (future)
```

- Model: `server/src/models/Trip.js` (see `docs/DATABASE.md`). Itinerary days,
  inclusions, exclusions, and trip-specific FAQs are **embedded arrays**.
- Every Trip must reference an existing Destination (`destinationId`); the
  service validates existence and returns a clear 400 error otherwise.
- Slugs reuse `utils/slugify.js` (`ensureUniqueSlug`). `tripCode` (`TRP-000001`)
  is generated server-side, unique, and not client-editable.
- Publishing: `published` boolean; drafts never exposed publicly. Deleting a
  published Trip is blocked until it is unpublished.
- Services: `server/src/services/trip.service.js`; controllers/routes split
  between public (`trip.*`) and admin (`adminTrip.*`).
- Frontend:
  - Public: `pages/TripsPage.jsx` (cards, filters, pagination), `pages/TripPage.jsx`
    (itinerary/inclusions/exclusions/important info/FAQs/gallery + departure
    placeholder), `components/trips/TripCard.jsx`. The Destination detail page
    shows real trips for that destination.
  - Admin: `pages/admin/AdminTripsPage.jsx`, shared `components/admin/TripForm.jsx`
    (with `TripItineraryBuilder`, `ListItemEditor`, `FaqListEditor`),
    `AdminTripFormPage.jsx`.
  - Services: `client/src/services/trips.js` (`tripApi` public,
    `adminTripApi` admin). SEO via `useSeo` (`tripSeoTitle`).
- Dashboard trip count is real.

## Trip batch system (departures)

```
Public:  GET /api/trips/:tripId/batches  → published, open/full, future only (asc)
         GET /api/trips?includeBatches=true → trips + embedded upcoming departures
Admin:   /api/admin/trip-batches/*       → requireAuth + requireRole('admin')
Destination → Trip → TripBatch → Booking (future)
```

- Model: `server/src/models/TripBatch.js` (see `docs/DATABASE.md`). One document
  per departure with its own pricing (`price`, `originalPrice`), capacity
  (`totalSeats`/`bookedSeats`), booking window, status and `published` flag.
- `batchCode` (`BAT-000001`) is server-generated, unique, not client-editable.
- Dates are date-only values stored at UTC midnight; all comparisons use UTC day
  boundaries so calendar dates cannot shift with timezones (ADR-014).
- `availableSeats` and `discountAmount` are **derived**, never stored state.
- Public visibility is enforced in `tripBatch.service.js`
  (`publicVisibilityFilter`): published + open/full + departure in the future.
- Deletion of a batch with `bookedSeats > 0` is blocked (bookings will
  reference batches; no cascading delete).
- Services: `server/src/services/tripBatch.service.js`; admin routes/controllers
  mirror the trip module (`adminTripBatch.*`). The public per-trip endpoint is
  served from the trip router (`/:tripId/batches`).
- Frontend:
  - Admin: `pages/admin/AdminTripBatchesPage.jsx`,
    `pages/admin/AdminTripBatchFormPage.jsx`, shared
    `components/admin/TripBatchForm.jsx`.
  - Public: `components/trips/TripDepartures.jsx` on `/trip/:slug`; homepage
    cards consume embedded batches via `UpcomingTripsSection`.
  - Services: `client/src/services/tripBatches.js` (`tripBatchApi`,
    `adminTripBatchApi`).

## Trip discovery (/trips)

The `/trips` page is a server-driven Capture A Trip-style discovery experience.
All filter/sort/search/page state lives in the URL (`?search=&destination=&
tripType=&category=&minPrice=&maxPrice=&departureDate=&departureFrom=&
departureTo=&sort=&page=`), making views shareable, refresh-safe and
back/forward friendly.

```
Client (URL params, debounced search)
    ↓ single GET /api/trips with all params
Express → trip.service.listPublic()
    ├── resolve destination slug / category / search → destination ids
    ├── if budget/date filters or price/departure sort:
    │     ONE TripBatch aggregation over upcoming public batches
    │     (group per trip: cheapest batch + soonest departure)
    └── paginate trips (Mongo fast path OR in-memory batch-aware path),
        hydrate only the current page, attach pricingSummary + batches[]
```

Key properties:
- **Batch-aware semantics**: a trip matches a budget/date filter when at least
  one upcoming public batch qualifies; displayed starting price is the lowest
  qualifying upcoming batch price. `pricingSummary` is attached only in
  batch-aware responses; cards otherwise use embedded `batches[]`.
- **No N+1**: batches are fetched for the whole result set in one query
  (aggregation or visibility-filtered find), never per trip.
- **Indexes**: `TripBatch { published, status, departureDate }` serves the
  discovery aggregation; `{ tripId, published, status, departureDate }` serves
  per-trip listings. `Trip { published, featured, displayOrder }`,
  `destinationId`, unique `slug`/`tripCode` cover the rest.
- Frontend: `pages/TripsPage.jsx` (URL state via `useSearchParams`),
  reusable `components/trips/TripDestinationTabs.jsx` and
  `TripFilterPanel.jsx` (shared by desktop sidebar + mobile Sheet drawer),
  refined `components/trips/TripCard.jsx`. Homepage destination tabs link into
  the same system (`/trips?destination=…`) — no duplicated logic.

## Booking system

```
Trip detail  ──Book Now──▶  /booking/:tripSlug?batch=<id>
                                │ auth gate (existing LoginModal, state kept in URL)
                                ▼
        wizard: travellers → details+contact → review ──confirm──▶ POST /api/bookings
                                                                    │
                     /booking/BK-xxxxxx  ◀──────  Booking created (pending/unpaid)
```

- **Server authority**: the service loads the TripBatch, enforces bookability
  (published, open/full, future departure, booking window), atomically reserves
  seats, computes the price snapshot and persists the booking. Client pricing
  fields are ignored.
- **Seat concurrency** (ADR-016): a conditional
  `TripBatch.findOneAndUpdate({ $expr: bookedSeats ≤ totalSeats − count },
  { $inc: bookedSeats: count })` serializes concurrent bookings at the
  database. The booking is inserted after the reservation; any failure
  compensates the reservation exactly once. Idempotency keys (unique per user)
  make duplicate submissions return the original booking.
- **Cancellation**: status-guarded flip first, atomic seat release second,
  revert-on-release-failure — never half-cancelled.
- Layers: `booking.routes.js` (requireAuth) → `booking.controller.js` →
  `booking.service.js`; admin mirror under `/api/admin/bookings`.
- Frontend: `pages/BookingPage.jsx` (3-step wizard, URL state),
  `pages/BookingConfirmationPage.jsx`, shared `BookingPriceSummary`,
  `services/bookings.js`. Both pages are `noindex`.

## Reviews & ratings

```
Public:  GET /api/reviews/trips/:slugOrId/reviews  → approved + summary (agg)
Auth:    GET  …/eligibility · POST /api/reviews · GET /api/reviews/me
Admin:   /api/admin/reviews (list / moderate / delete)
```

- Eligibility: a user may review a trip only with a CONFIRMED or COMPLETED own
  booking for it; one review per user per trip (compound unique index);
  cancelled/pending/payment_pending bookings are excluded.
- Moderation defaults to `pending`; only `approved` reviews appear publicly.
- Rating summaries are computed by a single aggregation over approved reviews
  (ObjectIds normalised for `$match`) and attached to trip detail/list APIs —
  never stored on Trip.
- Frontend: `TripReviews` section on the trip page (summary, distribution bars,
  verified cards, write-review dialog with eligibility messaging),
  `/account/reviews` status list, and `/admin/reviews` moderation console.

## Travel blogs

```
Public:  GET /api/blogs · GET /api/blogs/destination/:slug · GET /api/blogs/:slug
Admin:   /api/admin/blogs (CRUD + publish/unpublish, requireAuth+admin)
```

- Content is stored as **typed blocks** (ADR-020) rendered client-side by
  `BlogContentView`; paragraphs support inline `[text](url)` links.
- Public APIs return only `published` blogs. Search spans title/excerpt/tags
  and linked destination names/countries in one `$or` query. Filtering supports `category` (enum) and `tag` (exact match on `tags[]`), both driven by URL query params in `BlogsPage.jsx` (`?category=` / `?tag=` shareable, pagination-safe).
- Related posts resolve same-destination first, then same-category, then recent.
- Summaries of other systems stay untouched; slugs reuse `ensureUniqueSlug`.

## FAQs

Public `GET /api/faqs` (global) and scoped `GET /api/destinations/:slug/faqs`,
`GET /api/trips/:slug/faqs` (priority-merged, deduped). Admin CRUD under
`/api/admin/faqs` with publish/reorder. All public reads are published-only,
ordered by `displayOrder`.

## Wishlist
Wishlist (`Wishlist` model) sits beside `Booking` under account scope; populated via batch fetch to avoid N+1, integrated via `WishlistButton` on cards.

## Homepage content feeds
- `GET /api/reviews/recent?limit=N` (public) returns latest approved reviews with trip context — powers the homepage reviews section. No new image system: Cloudinary `DestinationImage` reused everywhere.

## Notifications
Events raised inside Booking/TripBatch/Review services call the reusable notification service (fire-and-forget). Header bell + account page read `/api/account/notifications`.

## Customer account

```
/account (layout guards auth; noindex)
  ├── /account            → Profile (GET/PATCH /api/account/profile)
  ├── /account/bookings   → own bookings (+ /:bookingCode detail, cancel via
  │                          the Phase 9 cancellation API)
  └── /account/travellers → saved travellers CRUD (/api/account/travellers/*)
```

- Backend `account.routes.js` (requireAuth) → thin controllers →
  `account.service.js` (profile + travellers) and the existing
  `booking.service.js` for bookings — one booking system, no duplication.
- Profile updates are whitelisted to name+email; mobile is the OTP identity
  (ADR-018). Traveller ownership is enforced in every query.
- The booking wizard reads saved travellers for optional quick-fill; values are
  copied into the booking snapshot at creation.

## Homepage

The homepage (`/`, `pages/HomePage.jsx`) is a real Capture A Trip-style
marketing page built from our own data and branding. Section order/visibility is
driven by `lib/homeContent.js` (`HOMEPAGE_SECTIONS`), so a future CMS can manage
it. The reference structure is mapped to our own sections:

1. `PromoBanner` — top announcement bar (config).
2. `HeroSection` — travel hero with a search that navigates to `/trips?search=…`.
3. `CommunityStats` — config-driven social-proof strip; no fabricated numbers.
4. `DestinationExplorer` — category tabs (All/International/Domestic/Weekend,
   backed by `Destination.category`) + a destination tile carousel.
5. `UpcomingTripsSection` — destination tabs + `HomepageTripCard` carousel of
   real published trips. Cards show real departure dates, batch pricing,
   original-price strikethrough and discounts from embedded TripBatch data
   (graceful "dates coming soon" fallback when a trip has no upcoming batches).
6. `BookWithConfidence`, `WhyChooseUs` — config-driven benefit/USP cards.
7. `TrendingDestinations` — real destinations with starting price (hidden when
   unavailable).
8. `ReviewsSection`, `CommunityMoments`, `RelatedBlogs`, `RealityTripsSection` —
   clean "coming soon" placeholders (no fake reviews/blogs/videos).
9. `HomepageFaqSection` — accessible accordion, config-driven FAQs.
10. Existing `Footer`.

Data sources: `destinationApi` (published, optional `category` filter) and
`tripApi` (published, optional `search` filter by name/destination). Carousels
use `components/ui/horizontal-carousel.jsx` (CSS scroll snap + native scroll).

## Database architecture

See `docs/DATABASE.md`. Key relationship:

```
Destination
    ↓
Trip
    ↓
TripBatch      ← one document per departure date, own pricing/availability
    ↓
Booking        ← must update bookedSeats atomically (future milestone)
    ↓
Traveller
```

Trip departure dates are modelled as `TripBatch` so each departure is
independently manageable.
