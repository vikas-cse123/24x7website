# API

Planned REST API for **24x7Chhutti**. Most endpoints are **planned**; they are
added as their milestones are reached (see `docs/ROADMAP.md`). Implemented so
far: `GET /api/health` and the authentication endpoints under `/api/auth`.

Base path: `/api`. All endpoints are grouped by resource.

## Conventions

- REST over JSON.
- Response envelope:
  - Success: `{ "success": true, "data": ..., "message": "..." }`
  - Error: `{ "success": false, "message": "...", "errors": [...] }`
- Inputs are validated server-side (Zod).
- Errors handled by central error-handling middleware.
- Authentication via JWT in HTTP-only cookies (implemented).

## Endpoint groups

### Health
| Method | Path          | Purpose                    | Status     |
| ------ | ------------- | -------------------------- | ---------- |
| GET    | `/api/health` | Liveness/health check      | IMPLEMENTED |

### Auth (`/api/auth`) — IMPLEMENTED
- `POST /api/auth/send-otp` — request an OTP for a mobile number (mock in dev)
- `POST /api/auth/verify-otp` — verify OTP, create/find user, set auth cookie
- `GET /api/auth/me` — current user (protected)
- `POST /api/auth/logout` — clear the auth cookie

See `docs/AUTHENTICATION.md` for full details and the OTP behaviour.

### Users (`/api/users`)
- `GET /api/users` — list users (admin)
- `GET /api/users/:id` — user detail
- `PATCH /api/users/:id` — update user
- `DELETE /api/users/:id` — delete user (admin)

### Destinations (`/api/destinations`) — IMPLEMENTED (public)
- `GET /api/destinations` — list **published** destinations. Query params:
  `page` (default 1), `limit` (default 12, max 50), `country`, `category`
  (`international | domestic | weekend | other`), `featured`.
  Response: `{ success, data: { items, page, limit, total, totalPages } }`.
- `GET /api/destinations/:slug` — public destination detail (**published only**;
  draft or missing → 404).

Admin destination endpoints live under `/api/admin/destinations` (see Admin
section below).

### Trips (`/api/trips`) — IMPLEMENTED (public)
- `GET /api/trips` — list **published** trips (trip discovery). Query params:
  - `page` (default 1), `limit` (default 12, max 50)
  - `search` — matches trip name, trip code, or destination name/country
    (server-side, regex-escaped)
  - `destination` — destination slug (published destinations only)
  - `category` — `international | domestic | weekend | other`; resolves through
    the destination's `category` field
  - `tripType` — one of the centralised trip types
  - `featured` — `true|false`
  - `minPrice` / `maxPrice` — budget range resolved against upcoming **public
    TripBatch** prices; a trip matches when at least one upcoming public batch
    falls within the range
  - `departureDate` (`YYYY-MM-DD`) and/or `departureFrom`/`departureTo`
    (inclusive range) — matched against upcoming public batch departure dates
  - `sort` — `recommended` (default; featured → displayOrder → name),
    `price_asc`, `price_desc`, `departure_asc` (soonest upcoming departure).
    Batch-based sorts order trips without upcoming batches last.
  - `includeBatches=true` — embeds up to 5 upcoming public departures per item
    (`batches[]`), narrowed by any active date/price filters
  Response: `{ success, data: { items, page, limit, total, totalPages } }`.
  Each item includes a populated `destination` summary. When a batch-aware
  filter/sort is active, items also carry `pricingSummary`:
  `{ price, originalPrice, discountAmount, currency, soonestDeparture,
  upcomingCount }` derived from the cheapest qualifying batch.
- `GET /api/trips/:slug` — public trip detail (**published only**; draft or
  missing → 404). Includes populated `destination`.

Invalid values are rejected with `400 { success:false, message:"Validation
failed", errors:[...] }` (bad dates, negative prices, unknown enums,
maxPrice < minPrice, reversed departure ranges).

Admin trip endpoints live under `/api/admin/trips` (see Admin section below).

### Trip batches (public) — IMPLEMENTED
- `GET /api/trips/:tripId/batches` — upcoming public departures for one trip.
  Returns only batches that are `published`, `status ∈ {open, full}`, and
  departing in the future; sorted by `departureDate` ascending. Unknown or
  unpublished trip → 404. Response:
  `{ success, data: { items: [TripBatch] } }`.
- `GET /api/trips?includeBatches=true` — trips list where each item additionally
  embeds up to 5 upcoming public departures (`batches[]`) so the homepage cards
  can show real dates/prices with a single request.

A `TripBatch` item contains: `id`, `tripId`, `batchCode`, `departureDate`,
`returnDate`, `price`, `originalPrice`, `discountAmount` (derived,
`null` when there is no discount), `currency`, `totalSeats`, `bookedSeats`,
`availableSeats` (derived), `bookingOpenDate`, `bookingCloseDate`, `status`,
`published`, timestamps. Admin responses also embed a populated `trip` summary.
All dates are UTC-midnight ISO strings from `YYYY-MM-DD` inputs (ADR-014).

### Bookings (`/api/bookings`) — IMPLEMENTED (authenticated)
All endpoints require the existing JWT auth cookie; every response is scoped to
the authenticated user.

- `POST /api/bookings` — create a booking. Body:
  `{ tripBatchId, travellerCount, travellers[], customerName, customerEmail,
  customerPhone, countryCode?, termsAccepted: true, idempotencyKey }`.
  The server loads the batch, enforces bookability (published, open/full,
  future departure, booking window), atomically reserves seats, computes the
  price snapshot and creates the booking. Client-supplied pricing fields are
  ignored. Errors: 400 validation / unbookable batch; 401 unauthenticated;
  404 unknown; **409** sold out or "Only N seats are currently available."
  Same-key retries return the original booking (idempotent).
- `GET /api/bookings` — own bookings (paginated, newest first).
- `GET /api/bookings/:id` — own booking detail (other users' → 404).
- `GET /api/bookings/code/:bookingCode` — own booking by code (used by the
  `/booking/BK-…` confirmation page).
- `POST /api/bookings/:id/cancel` — owner cancellation (pending/confirmed/
  payment_pending only); releases seats atomically.

Admin (`/api/admin/bookings`, requireAuth + admin):

- `GET /api/admin/bookings` — all bookings. Query: `page`, `limit`,
  `search` (code/customer/email/phone/trip), `status`, `paymentStatus`
- `GET /api/admin/bookings/:id` — full detail incl. travellers + snapshot
- `PATCH /api/admin/bookings/:id/status` — `{ status }` among pending /
  confirmed / payment_pending / completed (cancelled must use the cancel
  endpoint so seats release)
- `PATCH /api/admin/bookings/:id/cancel` — admin cancellation with seat release

### Wishlist (`/api/account/wishlist`) — IMPLEMENTED
- `POST /api/account/wishlist` — `{type, id}`
- `GET /api/account/wishlist` — populated items
- `DELETE /api/account/wishlist/:type/:id`

### Notifications (`/api/account/notifications`) — IMPLEMENTED
- `GET /` — own notifications (pagination)
- `GET /unread-count`
- `PATCH /:id/read`
- `PATCH /read-all`
- `DELETE /:id`
All require auth; cross-user → 404.

### Account (`/api/account`) — IMPLEMENTED (authenticated)
All endpoints require the existing JWT auth cookie.

- `GET  /api/account/profile` — own profile (name/email/mobile/verified/role)
- `PATCH /api/account/profile` — update **name + email only**; mobile is the
  OTP login identity and read-only (ADR-018). role/verification flags are
  server-owned and ignored. Duplicate email → 400.
- `GET  /api/account/bookings?page&limit&status` — own bookings (delegates to
  the Phase 9 service; same shapes as `/api/bookings`)
- `GET  /api/account/bookings/:bookingCode` — own booking detail by code
- `GET  /api/account/travellers` — list saved travellers
- `POST /api/account/travellers` — add ({firstName, lastName, email?, phone?,
  countryCode?, gender?, dateOfBirth?})
- `PATCH /api/account/travellers/:id` — update (owner-scoped, else 404)
- `DELETE /api/account/travellers/:id` — remove (owner-scoped, else 404)

### Legacy travellers endpoints (`/api/travellers`)
- `GET /api/travellers` — list travellers (admin)
- `GET /api/travellers/:id` — traveller detail
- `PATCH /api/travellers/:id` — update traveller
- `DELETE /api/travellers/:id` — delete traveller

### Enquiries (`/api/enquiries`) — IMPLEMENTED (Phase 27)
Public lead submission (works for logged-out visitors — `optionalAuth` only):
- `POST /api/enquiries` — submit enquiry. Body: `{ name, destinationId, phone,
  email, source?, message?, countryCode? }`. `source` is an allowed enum
  (`website | custom_trip | contact_form | trip_page | destination_page`); the
  custom-trip "Plan Your Dream Trip" modal sends `custom_trip`. Server-side
  validation (Zod): name required, destinationId must be a valid published
  destination ObjectId, phone is a 10-digit Indian mobile (`6-9` prefix), email
  valid. Destination must exist and be PUBLISHED (400 otherwise). Created with
  `status: 'new'`. Optional `userId` attribution is stored when a valid session
  exists but never returned to the public caller.

Admin (RBAC — `requireAuth` + admin role at the parent admin router):
- `GET    /api/admin/enquiries` — list. Query: `page`, `limit` (max 100),
  `status` (new/in-progress/resolved), `source`, `search`
  (name/email/phone/destinationName)
- `GET    /api/admin/enquiries/:id` — detail
- `PATCH  /api/admin/enquiries/:id/status` — set status (`{ status }`)
- `DELETE /api/admin/enquiries/:id` — delete

Unauthenticated → 401; authenticated non-admin → 403.

### Reviews (`/api/reviews`) — IMPLEMENTED
Public:
- `GET /api/reviews/trips/:slugOrId/reviews?page&limit` — approved reviews for a
  trip + `summary` (`{ average, total, distribution{1..5} }`). Accepts slug or id.
Guest:
- `GET /api/reviews/trips/:slugOrId/reviews/eligibility` — guests get
  `{ eligible:false, reason:'login-required' }`.
Authenticated:
- `POST /api/reviews` — create. Body: `{ tripId, rating(1–5), title(3–150),
  text(10–2000) }`. Eligibility enforced server-side: caller must own a
  confirmed/completed booking for that trip; one review per user per trip (409).
  New reviews start `pending`. `userId` always comes from the auth cookie.
- `GET /api/reviews/me` — own reviews with status + trip context.

Legacy (pre-phase) planned endpoints below:

### Reviews (`/api/reviews`)
- `GET /api/reviews?tripId=` — list reviews for a trip
- `POST /api/reviews` — submit review (customer)
- `PATCH /api/reviews/:id` — moderate (admin)

### Blogs (`/api/blogs`) — IMPLEMENTED
- `GET /api/blogs` — list published blogs. Query: `page` (1 default, 9 default limit), `limit` (max 50), `search` (title/excerpt/tags + destination name/country), `category` (one of `travel-guide | things-to-do | places-to-visit | trekking | shopping`), `tag` (exact tag match against `tags[]`), `destination` (slug), `featured` (true/false). Response `{ success, data: { items, page, limit, total, totalPages } }`. Client `BlogsPage` drives `category`/`tag`/`search`/`page` via URL query params (shareable, pagination-safe).
- `GET /api/blogs/destination/:destinationSlug` — same filters plus destination scoping; 404 if destination unknown.
- `GET /api/blogs/:slug` — blog detail (published only, 404 otherwise) plus `related` (same destination → same category → recent, limit 3).
- `POST /api/blogs` / `PATCH /api/blogs/:id` / `DELETE /api/blogs/:id` — admin (via `/api/admin/blogs`) with publish/unpublish.

### Trip Media (`/api/trips/:tripId/media` + `/api/admin/media`) — IMPLEMENTED
- `GET /api/trips/:tripId/media?mediaType=photo|video` — published traveler media
- `GET /api/admin/media?tripId=&mediaType=&published=&page=&limit=` — admin list
- `POST /api/admin/media` — create (tripId, mediaType, publicId/secureUrl, etc.)
- `PATCH /api/admin/media/:id` — update, `PATCH /:id/publish` — toggle, `POST /reorder` — order, `DELETE /:id` — delete (no Cloudinary asset delete)

### Media (`/api/media`)
- `POST /api/media` — upload media (Multer + Cloudinary)
- `GET /api/media` — list media
- `DELETE /api/media/:id` — delete media

### Payments (`/api/payments`)
- `POST /api/payments/create-order` — create Razorpay order
- `POST /api/payments/verify` — verify payment (server-side)
- `GET /api/payments/:id` — payment detail

### Admin (`/api/admin`) — FOUNDATION IMPLEMENTED
All `/api/admin/*` routes require authentication (`requireAuth`) and an admin
role (`requireRole('admin')`). Unauthenticated → 401; authenticated non-admin →
403.

- `GET    /api/admin/reviews` — list all reviews. Query: `page`, `limit`,
  `status` (pending/approved/rejected), `search` (title/text/traveller/trip)
- `PATCH  /api/admin/reviews/:id/status` — moderate: approve / reject / pending
- `DELETE /api/admin/reviews/:id` — permanently delete a review
- `GET /api/admin/dashboard` — dashboard summary (destinations, trips and real
  batch metrics counted; bookings/enquiries zeroed until implemented)
- `GET /api/admin/destinations` — list all destinations (draft + published).
  Query: `page`, `limit` (max 100), `search` (name/country), `published`
- `GET /api/admin/destinations/:id` — destination detail
- `POST /api/admin/destinations` — create destination
- `PATCH /api/admin/destinations/:id` — update destination
- `DELETE /api/admin/destinations/:id` — delete destination
- `PATCH /api/admin/destinations/:id/publish` — publish
- `PATCH /api/admin/destinations/:id/unpublish` — unpublish
- `GET /api/admin/trips` — list trips (draft + published). Query: `page`,
  `limit` (max 100), `search` (name/code), `destinationId`, `tripType`, `published`
- `GET /api/admin/trips/:id` — trip detail (with populated destination)
- `POST /api/admin/trips` — create trip (tripCode + slug generated server-side;
  `destinationId` must reference an existing destination)
- `PATCH /api/admin/trips/:id` — update trip (tripCode not editable; slug
  preserved unless explicitly provided)
- `DELETE /api/admin/trips/:id` — delete trip (published trips must be
  unpublished first → 400)
- `PATCH /api/admin/trips/:id/publish` — publish
- `PATCH /api/admin/trips/:id/unpublish` — unpublish
- `GET    /api/admin/trip-batches` — list batches (draft + published). Query:
  `page`, `limit` (max 100), `search` (batch code / trip name / trip code),
  `tripId`, `status`, `published`
- `GET    /api/admin/trip-batches/:id` — batch detail (populated trip)
- `POST   /api/admin/trip-batches` — create batch (`batchCode` generated
  server-side; `tripId` must reference an existing trip; cross-field rules
  enforced: return > departure, price ≤ originalPrice, 0 ≤ bookedSeats ≤
  totalSeats, bookingClose ≥ bookingOpen)
- `PATCH  /api/admin/trip-batches/:id` — update batch (`batchCode`/`createdBy`
  not editable; rules re-validated against merged values)
- `DELETE /api/admin/trip-batches/:id` — delete batch. **Blocked with 400 when
  `bookedSeats > 0`** (future bookings reference batches; no cascading delete)
- `PATCH  /api/admin/trip-batches/:id/publish` — publish
- `PATCH  /api/admin/trip-batches/:id/unpublish` — unpublish
- `PATCH  /api/admin/trip-batches/:id/status` — change status.
  Body: `{ "status": "draft|open|full|closed|cancelled|completed" }`
- `GET    /api/admin/bookings` — list bookings. Query: `page`, `limit`,
  `search` (code/customer/email/phone/trip), `status`, `paymentStatus`
- `GET    /api/admin/bookings/:id` — booking detail (travellers + snapshot)
- `PATCH  /api/admin/bookings/:id/status` — change status (pending/confirmed/
  payment_pending/completed; cancellation uses the cancel endpoint)
- `PATCH  /api/admin/bookings/:id/cancel` — cancel + release seats
- User/role management — PLANNED
- Coupons (`/api/admin/coupons`) — PLANNED
- Settings — PLANNED
- (Other admin operations live under their respective resources)

## Dashboard response shape

```json
{ "success": true, "data": { "destinations": 0, "trips": 0, "upcomingBatches": 0, "openBatches": 0, "fullBatches": 0, "bookings": 0, "pendingBookings": 0, "confirmedBookings": 0, "paymentPendingBookings": 0, "enquiries": 0 }, "message": "Dashboard summary" }
```

Batch metrics are real counts: `upcomingBatches` = published open/full batches
departing in the future; `openBatches` / `fullBatches` = all batches currently
in those statuses.

## Security & production notes (Phase 20)

- All `/api/admin/*` behind `requireAuth` + `requireRole(...ADMIN_ROLES)` (`admin.routes.js:18`); owner scoping on `account`/`wishlist`/`notifications`/`bookings`/`travellers`/`reviews`.
- Validation: Zod schemas + `validate()` middleware; ObjectId regex checks; pagination `max 50` (public) / `100` (admin); image uploads `fileFilter image/*` + `5 MB` limit (`middleware/upload.js:12`); Cloudinary deletion guarded by `travel-crm/` prefix (`upload.controller.js:32`).
- Headers: `X-Content-Type-Options`, `X-Frame-Options DENY`, `Referrer-Policy`, `Permissions-Policy`, `HSTS` in prod + `CORS credentials:true` allowlist + `cookie httpOnly/secure/sameSite` (`app.js:8`, `config/index.js:21`).
- Errors: `errorHandler` returns safe 500 in prod (`middleware/error.js:9`, `config.isProduction`), preserves validation `errors` array, never leaks stack/DB internals.
- SEO: `robots.txt` disallows `/admin/account/booking/api`, `sitemap.xml` lists only indexable public URLs (filtered query URLs canonicalize, not sitemapped).

## Update policy

- Endpoints are added per milestone. When behaviour changes, update this document.
- Never claim an endpoint is implemented unless it exists and is verified.
