# DECISIONS

Architecture Decision Log (ADRs) for **24x7Chhutti**. Append new decisions here
when the architecture changes. Each decision records date, decision, reason, and
consequences where useful.

---

## ADR-001 — React.js + Vite instead of Next.js
- **Date:** 2026-08-24
- **Decision:** Use React.js with Vite (SPA) for the frontend.
- **Reason:** A separate SPA + REST backend is the chosen architecture; keeps
  frontend and backend decoupled and simpler to evolve. Vite is fast and
  widely adopted.
- **Consequences:** SEO for public travel pages must be handled via metadata/SEO
  best practices rather than server-side rendering (handled later in the SEO
  milestone).

## ADR-002 — Express.js for the backend
- **Date:** 2026-08-24
- **Decision:** Use Node.js + Express.js with a REST API for the backend.
- **Reason:** Mature, widely-used, minimal, and fits the separated frontend/backend
  architecture. Aligns with the chosen database (Mongoose).
- **Consequences:** Business logic and data access live server-side; the client is
  a pure API consumer.

## ADR-003 — MongoDB + Mongoose
- **Date:** 2026-08-24
- **Decision:** Use MongoDB as the database with Mongoose ODM.
- **Reason:** Flexible document model fits varied travel content (itineraries,
  inclusions/exclusions, galleries). Widely used with Node/Express.
- **Consequences:** Never switch to PostgreSQL/Prisma. Data is schema-flexible; use
  Mongoose schemas to keep it structured.

## ADR-004 — shadcn/ui + Tailwind CSS
- **Date:** 2026-08-24
- **Decision:** Use shadcn/ui components on Tailwind CSS for the UI.
- **Reason:** Accessible, customizable, copy-in primitives that compose well and
  match a Tailwind-based design system.
- **Consequences:** UI primitives live in `client/src/components/ui/` and are
  styled via Tailwind tokens.

## ADR-005 — REST API
- **Date:** 2026-08-24
- **Decision:** Use a REST API (JSON) between the client and server.
- **Reason:** Simple, established, and fits the separated architecture. No GraphQL
  unless explicitly approved later.
- **Consequences:** Consistent response envelope and per-resource endpoints under
  `/api`.

## ADR-006 — TripBatch represents individual departure batches
- **Date:** 2026-08-24
- **Decision:** Model trip departure dates as a separate `TripBatch` entity, one
  document per departure date, each with its own price, capacity, and availability.
- **Reason:** Each departure must be independently manageable (date, price, seats,
  status), enabling e.g. different prices for different dates of the same trip.
- **Consequences:** Relationship chain:
  `Destination → Trip → TripBatch → Booking → Traveller`. A trip with N departures
  has N `TripBatch` documents.

## ADR-007 — `logo.jpg` is the official project logo and must be preserved
- **Date:** 2026-08-24
- **Decision:** Treat the existing `logo.jpg` at the repository root as the
  official 24x7Chhutti logo. Do not delete, rename, replace, or modify it.
- **Reason:** It is the provided project logo and must remain the canonical asset.
- **Consequences:** UI must reference the original `logo.jpg` (e.g. copied to
  client public assets or imported) without altering the source file. This is a
  hard rule for all agents.

## ADR-008 — Mobile-number OTP authentication with JWT in HTTP-only cookie
- **Date:** 2026-08-24
- **Decision:** Authenticate customers via an Indian mobile-number + OTP flow. On
  successful OTP verification, issue a JWT and store it in an HTTP-only cookie.
- **Reason:** Mobile-first login matches the travel platform's audience and
  avoids managing passwords for customers. HTTP-only cookies keep the token out
  of `localStorage`, reducing XSS token-theft risk.
- **Consequences:**
  - OTP delivery is a development **mock** for now (echoed in dev responses,
    no real SMS). It will be replaced by a real SMS provider in a later
    milestone via the same `otp.service.js` interface.
  - Cookie security is environment-dependent: `secure`/`sameSite=none` in
    production, `secure=false`/`sameSite=lax` in development.
  - No JWT is ever stored in `localStorage`.

## ADR-009 — Design system tokens + single global auth modal via UI store
- **Date:** 2026-08-24
- **Decision:**
  1. Define the design system as Tailwind tokens (CSS variables + tailwind.config
     theme): a brand green (`142 76% 36%`), neutral surfaces, spacing scale,
     `0.75rem` radius, card/header shadows, a 1440px container, and a global
     `:focus-visible` ring.
  2. Mount the existing `LoginModal` once inside `PublicLayout` and control it via
     a small Zustand UI store (`stores/ui.js`) instead of per-component state.
- **Reason:**
  1. A token-based design system keeps styles consistent and easy to extend across
     future pages without hardcoding per-component styles.
  2. The header (and any future component) must open the existing auth modal
     without duplicating modal code or auth logic.
- **Consequences:**
  - The "Login / Sign Up" button in the header and mobile nav both call
    `openAuthModal()`; there is exactly one LoginModal instance.
  - New UI primitives are added under `components/ui/` (e.g. `Sheet` for the
    mobile drawer, `Container`) and reused rather than duplicated.
  - Navigation is centralized in `lib/nav.js` so header, mobile nav and footer
    share a single source of truth.

## ADR-010 — Backend-enforced admin authorization (RBAC foundation)
- **Date:** 2026-08-24
- **Decision:** Admin APIs (`/api/admin/*`) are protected on the backend by
  `requireAuth` + `requireRole('admin')`. Frontend route protection
  (`RequireAdmin`) is UX only. Roles are read from the server-verified user
  (loaded from the database via the JWT `sub`), never from the client.
- **Reason:** Frontend guards are trivially bypassable; the backend must be the
  security boundary. Reading the role from the DB-backed user prevents
  client-supplied role spoofing.
- **Consequences:**
  - Roles are `user | staff | admin` (`server/src/utils/roles.js`); `admin` can
    access the panel, `user` cannot, `staff` is scaffolded for later granular
    permissions.
  - New admin endpoints only need to live under the `/api/admin` router to be
    protected automatically.
  - Admin UI is served by `AdminLayout` under `/admin` with placeholder pages
    until each section's milestone.

## ADR-011 — Destination slug + publish model and URL-based image architecture
- **Date:** 2026-08-24
- **Decision:**
  1. Destinations use a generated, unique, lowercase URL-safe `slug`
     (`server/src/utils/slugify.js`). On create the slug is derived from the
     name (a numeric suffix is appended on collision); on update the slug is
     **preserved unless explicitly provided**, so a published destination's URL
     does not change unexpectedly.
  2. Destinations have a `published` boolean (draft/published). Public APIs
     return **published only**; drafts are editable in admin and return 404
     publicly. No preview mechanism is implemented yet.
  3. Images (`heroImage`, `gallery[]`) are stored as `{ url, publicId, alt }`.
     Until Cloudinary credentials exist, images are **URL-based** (development);
     `publicId` will be populated by the future media service.
- **Reason:** Stable URLs and explicit publish control are core to a
  production travel site; URL-based image entry keeps the milestone self
  contained without inventing credentials.
- **Consequences:**
  - Public destination detail must never expose drafts (verified).
  - The update schema intentionally has **no Zod defaults** so omitted fields
    (e.g. `published`) are never reset to defaults on PATCH — a trap identified
    and fixed in this milestone.
  - Cloudinary integration later only needs to populate `publicId`/`url`; the
    model and form shapes already accommodate it.

## ADR-012 — Trip entity: embedded content, server-generated tripCode, publish-guard delete
- **Date:** 2026-08-24
- **Decision:**
  1. Trips embed itinerary days, inclusions, exclusions, and trip-specific FAQs
     in the Trip document (no separate collections) and belong to a Destination
     via a validated `destinationId` ref.
  2. `tripCode` (`TRP-000001`) is generated server-side, unique, and never
     accepted from clients. Slugs reuse `ensureUniqueSlug` and are preserved on
     update unless explicitly changed.
  3. Deleting a **published** Trip is blocked (400) — unpublish first. Draft
     trips are editable in admin but never exposed publicly.
- **Reason:** Embedded content matches how a travel package is authored and
  read (one document per trip), avoiding cross-collection joins; server-generated
  codes/stable slugs protect URLs and references; the publish-delete guard keeps
  published content consistent ahead of TripBatch/booking references.
- **Consequences:**
  - `TripBatch` (next milestone) will attach via `tripId` and add
    departure-specific pricing; the base `startingPrice` remains the fallback.
  - Public trip APIs never expose drafts (verified).
  - Trip type values are centralised in `server/src/utils/tripTypes.js`.

## ADR-013 — Config-driven homepage built from real data + destination category field- **Date:** 2026-08-24
- **Decision:**
  1. The homepage (`pages/HomePage.jsx`) composes sections from
     `lib/homeContent.js` (`HOMEPAGE_SECTIONS` order/visibility, promo banner,
     benefits, USPs, FAQs) so a future CMS can manage them.
  2. Homepage sections consume the real `destinationApi` and `tripApi`; sections
     without real data (reviews, blogs, community moments, videos) render clean
     "coming soon" placeholders — **no fabricated statistics or testimonials**.
  3. Destinations gain a `category` field (`international | domestic | weekend |
     other`) powering the homepage destination tabs; the public trips API gains a
     basic `search` filter (name/destination) used by the hero search.
  4. Carousels use CSS scroll snapping + native horizontal scrolling (no carousel
     library).
- **Reason:** A data-driven homepage stays truthful (no fake trips/prices/reviews)
  and remains CMS-ready; category/search are small, documented API extensions that
  make the homepage functional without building the full search/booking stack.
- **Consequences:**
  - Future Review/Blog/Media systems populate the placeholder sections; the
    config lets a CMS reorder/hide sections.
  - TripBatch will supply the real departure dates shown in `HomepageTripCard`
    (currently a "coming soon" placeholder).
  - `HorizontalCarousel` items are `shrink-0` so cards overflow and scroll.

## ADR-014 — TripBatch date-only handling, derived pricing/availability, deletion safety
- **Date:** 2026-08-25
- **Decision:**
  1. Batch dates (`departureDate`, `returnDate`, `bookingOpenDate`,
     `bookingCloseDate`) are **date-only** values: clients send `YYYY-MM-DD`
     strings; the server stores them as `Date`s at **UTC midnight** and every
     comparison ("is departure in the future?") uses UTC day boundaries.
     Clients must format dates from the `YYYY-MM-DD` portion (see
     `client/src/lib/dates.js`), never by converting the ISO timestamp through
     the local timezone.
  2. `availableSeats` and `discountAmount` are **derived on read**
     (`totalSeats − bookedSeats`; `originalPrice − price` only when
     `originalPrice > price`). They are never stored as editable state, so no
     fake discounts or stale availability can exist.
  3. `batchCode` (`BAT-000001`) is generated server-side, unique, and not
     client-editable — same policy as tripCode.
  4. Deleting a batch with `bookedSeats > 0` is blocked (400). Future Booking
     records will reference batches; there is no cascade delete.
  5. The homepage trips list can embed up to 5 upcoming public departures per
     trip (`GET /api/trips?includeBatches=true`) so cards show real
     dates/prices with a single request (no N+1).
- **Reason:** Calendar dates are not timestamps; storing them at UTC midnight
  with UTC-day comparisons makes it impossible for `2026-10-03` to render as
  Oct 2 in any timezone. Derived values keep pricing/availability consistent
  by construction. The delete guard protects future booking references.
- **Consequences:**
  - The future Booking milestone MUST update `bookedSeats`
    atomically/transactionally (conditional `findOneAndUpdate` or transaction);
    documented in `docs/BOOKING_SYSTEM.md`. Not implemented yet.
  - Public visibility is enforced server-side only:
    `published && status ∈ {open, full} && departureDate > startOfUtcToday`.

## ADR-015 — Batch-aware trip discovery + canonical strategy for filtered URLs
- **Date:** 2026-08-25
- **Decision:**
  1. Budget (`minPrice`/`maxPrice`) and departure-date
     (`departureDate`/`departureFrom`/`departureTo`) filters on `GET /api/trips`
     are resolved against **upcoming public TripBatch** data: a trip matches a
     budget/date filter when at least one upcoming public batch qualifies.
  2. Query strategy (no N+1, no full-table hydration): ONE aggregation over
     `tripbatches` — `$match` visibility (+ date/price constraints) →
     `$sort price asc` → `$group by tripId` keeping the cheapest batch and the
     minimum departure → qualifying trip ids constrain the Trip query; a
     lightweight projection fetch orders results in memory (recommended order is
     the stable tie-break) and only the current page is hydrated with the full
     public projection. Plain queries (no batch filters/sorts) keep the original
     Mongo-side fast path so existing callers behave exactly as before.
  3. `sort=price_asc|price_desc|departure_asc` use the same per-trip aggregate;
     trips WITHOUT upcoming batches are not excluded by sorts alone — they sort
     last. Only actual filters exclude.
  4. Each item may carry a derived `pricingSummary`
     (cheapest qualifying batch's price/originalPrice/discount + soonest
     departure + count). It appears only in batch-aware responses; cards fall
     back to embedded `batches[]`, then `Trip.startingPrice`.
  5. Domestic/International discovery resolves through the EXISTING
     `Destination.category` field — no duplicated market data on Trip.
  6. SEO/canonical: `/trips` always emits `<link rel="canonical" href="…/trips">`
     regardless of active filters, so filter combinations do not create
     thousands of near-duplicate indexable URLs.
- **Reason:** TripBatch owns departure pricing/dates, so discovery must query it,
  but per-trip batch requests would be N+1. The single-aggregation approach keeps
  MongoDB sufficient (no Elasticsearch) at this scale while preserving exact
  pagination totals.
- **Consequences:** New compound index `{ published, status, departureDate }`.
  Filtered views are shareable/refresh-safe via URL params; homepage destination
  tabs now deep-link into `/trips?destination=…` instead of client-filtering.

## ADR-016 — Booking: atomic seat reservation, price snapshots, idempotency
- **Date:** 2026-08-25
- **Decision:**
  1. Seats are reserved by a conditional atomic update —
     `TripBatch.findOneAndUpdate({ _id, $expr: bookedSeats ≤ totalSeats − n },
     { $inc: { bookedSeats: n } })` — so concurrent bookings serialize at the
     database and overselling is impossible without transactions. The Booking
     document is inserted AFTER the reservation succeeds; every failure path
     compensates the reservation EXACTLY ONCE (guarded by a flag after a
     double-subtraction bug was found by concurrency tests).
  2. All booking pricing (`unitPrice/subtotal/discountAmount/totalAmount`) is
     computed server-side from the batch at creation and stored as an immutable
     snapshot. Client pricing fields are never accepted.
  3. Duplicate submissions are neutralised with a client-generated
     `idempotencyKey` and a compound unique index `{ userId, idempotencyKey }`;
     retries return the original booking instead of creating another.
  4. `bookingCode` (BK-000001) is generated server-side; the read-max race
     between concurrent creates is resolved by retrying the insert on a
     `bookingCode` unique-index collision (fresh code each attempt).
  5. Cancellation flips status with a status-guarded conditional update, then
     releases seats atomically; release failure reverts the flip.
- **Reason:** Seat integrity is the core correctness property of a travel
  commerce system; JS-level checks cannot survive concurrency, and historical
  totals must never drift when admins reprice departures.
- **Consequences:** Dev MongoDB is standalone (no transactions) — the chosen
  pattern is transaction-equivalent for this operation; upgrading to replica-set
  transactions later only touches `booking.service.js`. Payment gateway work
  (Phase 10) plugs into `paymentStatus` without schema changes.

## ADR-017 — Booking routes & privacy
- **Date:** 2026-08-25
- **Decision:** One public route `/booking/:param`: params starting with `BK-`
  render the private confirmation page, anything else renders the wizard for
  that trip slug. Departure selection travels in the query string. Both booking
  pages emit `<meta name="robots" content="noindex, nofollow">` via `useSeo`.
- **Reason:** The reference journey keeps departure + traveller state across the
  login interruption; URL-carried state means the existing LoginModal resumes
  the flow with zero extra plumbing, and shareable confirmation URLs stay
  owner-scoped server-side.
- **Consequences:** Confirmation URLs are usable only while logged in as the
  owner (404 otherwise, no existence leak). Filtered/canonical SEO of public
  pages is unaffected.

## ADR-018 — Account scope: profile whitelist, mobile as login identity, saved travellers copied into bookings
- **Date:** 2026-08-25
- **Decision:**
  1. `PATCH /api/account/profile` accepts ONLY `name` and `email`. The mobile
     number + country code are the OTP login identity (unique index, tied to
     `mobileVerified`) and stay read-only in the UI until a dedicated
     change-number flow with re-verification exists.
  2. A new `Traveller` model stores a user's saved travellers; every query is
     scoped by `userId` and cross-user access returns 404 (no existence leak).
  3. The booking wizard offers optional quick-fill from saved travellers, but
     traveller values are always **copied** into the Booking snapshot at
     creation — later edits/deletions of saved travellers never mutate existing
     bookings.
  4. `/api/account/bookings*` delegate to the Phase 9 booking service (adding a
     status filter there) rather than duplicating booking logic.
  5. The entire `/account` area is noindex.
- **Reason:** Login identity changes need verification flows that do not exist
  yet; copying traveller data keeps historical bookings immutable by design;
  delegation keeps one booking system.
- **Consequences:** Changing phone numbers requires future work (OTP
  re-verification). Traveller deletion never affects bookings.

## ADR-019 — Reviews: booking-based eligibility, default-pending moderation, aggregated summaries
- **Date:** 2026-08-25
- **Decision:**
  1. Only users owning a CONFIRMED or COMPLETED booking for a trip may review
     it. Pending/payment_pending (unpaid) and cancelled bookings never qualify.
     The server derives everything from auth + DB; client-sent userId/status is
     ignored.
  2. One review per user per trip via compound unique index `{ userId, tripId }`;
     duplicate creates return 409.
  3. New reviews start `pending`. Public endpoints return APPROVED only;
     admins approve/reject/unpublish with confirmation dialogs.
  4. Rating summaries (average, total, distribution{1..5}) are computed by one
     aggregation over approved reviews whenever trip detail/list APIs respond —
     never denormalised onto Trip. Aggregation inputs are normalised to
     ObjectIds because MongoDB does not cast strings inside pipelines.
  5. `travellerName` is snapshotted from the booking at creation so public
     cards stay stable regardless of later profile changes ("Verified booking"
     badge is therefore truthful).
- **Reason:** Review authenticity is the product's trust core; tying reviews to
  paid/confirmed bookings prevents drive-by spam while moderation protects
  content quality. Aggregation avoids stale denormalised counters.
- **Consequences:** Admin approving/unpublishing instantly changes public
  summaries. Deleting a booking does not delete its review (historical record).

## ADR-020 — Blog content as structured blocks instead of a rich-text editor
- **Date:** 2026-08-25
- **Decision:**
  1. Article bodies are stored as an ordered array of typed blocks — heading,
     paragraph, list, image (URL-based), quote — validated by Zod on both ends.
  2. The admin uses a purpose-built block editor (add/remove/reorder blocks)
     built from existing shadcn/ui primitives. No rich-text/editor package was
     added; paragraphs support minimal inline `[text](url)` links rendered by a
     tiny client helper.
  3. `readingTime` is computed server-side from block text (~200 wpm); author is
     a display string derived from the creating admin user; slugs reuse
     `ensureUniqueSlug` and publishing transitions maintain `publishedAt`.
- **Reason:** The required content shapes are simple and known; a WYSIWYG
  editor would add a large dependency, sanitisation risk, and unstructured HTML
  for marginal benefit. Blocks render predictably across the site and are easy
  to extend (e.g. video embeds later) without schema churn.
- **Consequences:** No inline image uploads in this phase (URL strategy matches
  the rest of the project). Migrating to a rich-text pipeline later means
  transforming blocks → HTML once, in one place (`BlogContentView`).

## ADR-021 — Blogs SEO & canonical strategy
- **Date:** 2026-08-25
- **Decision:** `/blogs` and `/blogs/:destinationSlug` always emit canonicals
  pointing at their own section root (filter/search state excluded), while each
  article emits its own canonical plus Open Graph article metadata (title,
  description, cover image) via the extended `useSeo`.
- **Reason:** Filter combinations would otherwise create near-duplicate
  indexable listings, while individual articles ARE meaningful landing pages.
- **Consequences:** Consistent with the trips discovery approach (ADR-015).

## ADR-022 — FAQ CMS: scope model, priority merge, displayOrder
- **Date:** 2026-08-25
- **Decision:**
  1. FAQ is a flat model with mutually-exclusive scope: global (no refs),
     destination-specific, or trip-specific. `destinationId` and `tripId` cannot
     both be set. Duplicate questions in the same scope are rejected (409,
     case-insensitive) to avoid confusion.
  2. Public reads are published-only and ordered by `displayOrder`. Admin has a
     bulk `POST /api/admin/faqs/reorder` endpoint so drag-free up/down moves
     translate to atomic displayOrder writes.
  3. Trip-page FAQs are resolved server-side as trip → destination → global
     (deduped by normalised question) so the client renders one Capture A
     Trip-style accordion without duplicate logic.
  4. Content is stored as Q/A strings; no second rich-text pipeline was added
     (keeps FAQs lightweight and searchable).
- **Reason:** FAQs are simple Q/A pairs; a single model with scope columns keeps
  homepage/destination/trip surfaces consistent while reusing one admin form and
  one accordion component. Priority merge avoids manual duplication.
- **Consequences:** FAQs stay on their contextual pages (no duplicate indexable
  /faqs listing page beyond the global API). Ordering is explicit via
  displayOrder rather than alphabetical.

## ADR-023 — Notifications: service-integrated events with deterministic dedupe
- **Date:** 2026-08-25
- **Decision:** A reusable notification service is invoked (fire-and-forget, `.catch`) from the Booking, TripBatch and Review services at real event points only (booking created/confirmed/cancelled/status, batch date-change/cancel for affected booked users, review submitted/approved/rejected to the owner). A deterministic `eventKey` (`<entity>:<id>:<type>`) with a unique `{userId,eventKey}` index makes retries idempotent. `userId` always comes from server context; cross-user reads/actions → 404.
- **Reason:** Notifications must follow the real domain events without coupling controllers; dedupe prevents retries/duplicate admin saves from spamming users.
- **Consequences:** Payment/marketing notifications remain out of scope. Future event sources add a call to the same service.
