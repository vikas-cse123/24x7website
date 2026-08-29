# DATABASE

MongoDB entity design for **24x7Chhutti**. Most entities are **planned
architecture only**; they are implemented as their milestones are reached (see
`docs/ROADMAP.md`). The **User** model is implemented as part of the
authentication milestone.

Database: **MongoDB** via **Mongoose**. Models live in `server/src/models/`.

## Key relationship

```
Destination
    ↓
Trip
    ↓
TripBatch
    ↓
Booking
    ↓
Traveller
```

Trip departure dates are represented using **`TripBatch`** — one document per
departure date, each with its own pricing and availability. This makes every
departure independently manageable.

## Example: Trip "Vietnam 8 Days"

| Trip        | Batch (departure) | Price     |
| ----------- | ----------------- | --------- |
| Vietnam 8 Days | September 5   | ₹51,999   |
| Vietnam 8 Days | September 19  | ₹51,999   |
| Vietnam 8 Days | October 3     | ₹52,999   |

Each of these departures is a separate `TripBatch` document linked to the same
`Trip`.

## Planned entities

### User — IMPLEMENTED
Registered customer / staff / admin account (`server/src/models/User.js`).

Supports the mobile-number OTP authentication system and future account
functionality.

- `mobile` — 10-digit Indian number (no country code)
- `countryCode` — e.g. `+91` (default)
- `name`, `email` — profile fields (email optional)
- `role` — `user` | `staff` | `admin` (default `user`). Used for RBAC
  (see `docs/ADMIN.md`); `admin` is required for the admin panel.
- `mobileVerified` — boolean OTP-verification state
- `lastLoginAt`, `isActive`
- timestamps (`createdAt`, `updatedAt`)

Constraints:
- Unique index on `(countryCode, mobile)`
- Sparse unique index on `email`

`toPublicUser()` is exported to strip internal fields and normalise the client
shape. See `docs/AUTHENTICATION.md` for details.

### Destination — IMPLEMENTED
A travel destination (country/region/city). `server/src/models/Destination.js`.
A Destination will eventually contain multiple Trips (`Destination → Trip → TripBatch → Booking`).

| Field            | Type         | Notes |
| ---------------- | ------------ | ----- |
| `name`           | String       | required, max 120 |
| `slug`           | String       | required, URL-safe, **unique**; lowercase |
| `country`        | String       | required, max 80 |
| `region`         | String       | optional, max 80 |
| `type`           | String       | enum `beach \| hill-station \| city \| wildlife \| cultural \| adventure \| religious \| other`, default `other` |
| `category`       | String       | enum `international \| domestic \| weekend \| other`, default `other`; market segment used by homepage destination tabs |
| `shortDescription` | String     | optional, max 300 |
| `description`    | String       | optional |
| `heroImage`      | `{ url, publicId, alt }` | sub-document |
| `gallery`        | `[{ url, publicId, alt }]` | array of sub-documents |
| `startingPrice`  | Number       | min 0, nullable (null = price on request) |
| `currency`       | String       | default `INR` |
| `featured`       | Boolean      | default `false` |
| `published`      | Boolean      | default `false` (draft) |
| `displayOrder`   | Number       | default 0 |
| `seoTitle` / `seoDescription` / `seoKeywords` | String | SEO fields |
| `createdBy` / `updatedBy` | ObjectId (ref User) | server-controlled |
| timestamps       | Date         | `createdAt`, `updatedAt` |

Indexes: unique `slug`; compound `(published, featured, displayOrder)`.

`toPublicDestination()` strips `createdBy`/`updatedBy`/`__v`. See `docs/ADMIN.md`
and `docs/API.md` for CRUD and publishing behaviour. Image `publicId` will be
populated by the media storage service (empty until then).

### Trip — IMPLEMENTED
A trip package belonging to a destination. `server/src/models/Trip.js`.
Every Trip belongs to an existing Destination via `destinationId` (ObjectId ref;
a clear validation error is returned if the destination does not exist). The
future relationship is `Destination → Trip → TripBatch → Booking`.

| Field                | Type         | Notes |
| -------------------- | ------------ | ----- |
| `destinationId`      | ObjectId (ref Destination) | required |
| `name`               | String       | required, max 160 |
| `slug`               | String       | required, URL-safe, **unique**; lowercase |
| `tripCode`           | String       | required, **unique**, server-generated (`TRP-000001`), not client-editable |
| `shortDescription`   | String       | optional, max 300 |
| `description`        | String       | optional |
| `tripType`           | String       | enum from `TRIP_TYPES` (`utils/tripTypes.js`): group, customized, honeymoon, family, adventure, weekend, international, domestic; default `group` |
| `durationDays` / `durationNights` | Number | min 1 / min 0 |
| `maxGroupSize`       | Number       | min 1 |
| `startingPrice`      | Number       | min 0, nullable (base package price only; batch pricing is TripBatch's job) |
| `currency`           | String       | default `INR` |
| `heroImage`          | `{ url, publicId, alt }` | sub-document |
| `gallery`            | `[{ url, publicId, alt }]` | array of sub-documents |
| `itinerary`          | `[{ dayNumber, title, description, activities[], meals[], accommodation, notes }]` | embedded, one object per day |
| `inclusions` / `exclusions` | `[String]` | structured lists |
| `importantInformation` | String     | visa/passport/cancellation/fitness/luggage/weather notes |
| `faqs`               | `[{ question, answer }]` | embedded trip-specific FAQs |
| `featured` / `published` | Boolean   | default `false` |
| `displayOrder`       | Number       | default 0 |
| `seoTitle` / `seoDescription` / `seoKeywords` | String | SEO fields |
| `createdBy` / `updatedBy` | ObjectId (ref User) | server-controlled |
| timestamps           | Date         | `createdAt`, `updatedAt` |

Indexes: unique `slug`, unique `tripCode`, compound `(published, featured, displayOrder)`, `destinationId`.

`toPublicTrip()` strips `createdBy`/`updatedBy`/`__v` and includes a populated
`destination` summary (`{ id, name, slug, country }`). Publishing: drafts are
editable in admin but never exposed publicly. Deletion of a published Trip is
blocked (unpublish first). `TripBatch` (next milestone) will add one document per
departure date with its own price/availability.

### TripBatch — IMPLEMENTED
A single departure of a trip — one document per date.
`server/src/models/TripBatch.js`. The chain is
`Destination → Trip → TripBatch → Booking (future)`.

| Field                | Type         | Notes |
| -------------------- | ------------ | ----- |
| `tripId`             | ObjectId (ref Trip) | required; validated server-side (clear 400 if the trip does not exist) |
| `batchCode`          | String       | required, **unique**, server-generated (`BAT-000001`), never client-editable |
| `departureDate`      | Date         | required; stored at **UTC midnight** from a `YYYY-MM-DD` input (see Date-only handling below) |
| `returnDate`         | Date         | required; must be strictly after `departureDate` |
| `price`              | Number       | required, min 0; per-person departure price |
| `originalPrice`      | Number       | nullable, min 0; when greater than `price`, discount = `originalPrice − price`. Never stored as editable state |
| `currency`           | String       | default `INR` |
| `totalSeats`         | Number       | required, ≥ 1 |
| `bookedSeats`        | Number       | default 0; ≥ 0 and ≤ `totalSeats` |
| `bookingOpenDate`    | Date         | nullable; booking window start |
| `bookingCloseDate`   | Date         | nullable; must be on/after `bookingOpenDate` |
| `status`             | String       | enum `draft \| open \| full \| closed \| cancelled \| completed`, default `draft` |
| `published`          | Boolean      | default `false`; only published batches can ever appear publicly |
| `notes`              | String       | internal notes (returned to admin only) |
| `createdBy` / `updatedBy` | ObjectId (ref User) | server-controlled |
| timestamps           | Date         | `createdAt`, `updatedAt` |

Indexes: unique `batchCode`; compound `(tripId, published, status,
departureDate)` powering the public upcoming-departure query; compound
`(published, status, departureDate)` added in Phase 8 for the discovery
aggregation (visibility + date/price filters without a tripId).

**Derived values (never stored as editable state):**
- `availableSeats = totalSeats − bookedSeats` — computed on every read
  (`computeAvailableSeats`). The future Booking system must update
  `bookedSeats` atomically (see `docs/BOOKING_SYSTEM.md`); availability is then
  always correct by construction.
- `discountAmount = originalPrice − price` when `originalPrice > price`,
  otherwise `null` (`computeDiscount`). No fake discounts are shown.

**Date-only handling:** clients send/receive calendar dates as `YYYY-MM-DD`.
The service stores them as `Date` objects at UTC midnight and compares against
UTC day boundaries (`startOfTodayUtc`). This makes timezone shift impossible:
`2026-10-03` can never become `2026-10-02` (see ADR-014).

**Public visibility (enforced in `tripBatch.service.js`, never the client):**
a batch appears publicly only when `published = true` AND `status ∈ {open,
full}` AND `departureDate` is strictly in the future.

**Deletion safety:** deleting a batch with `bookedSeats > 0` is blocked (400)
because future Booking records will reference it. There is no cascade delete.

`toPublicTripBatch()` strips internal fields and appends the derived
`availableSeats` / `discountAmount`; admin output also embeds a populated
`trip` summary (`name`, `slug`, `tripCode`, destination summary).

### FAQ — IMPLEMENTED
`server/src/models/Faq.js`. Reusable CMS: global (`destinationId` & `tripId` null),
destination-specific, or trip-specific (mutually exclusive).

| Field | Notes |
| ----- | ----- |
| `question` | required, 5–300 chars |
| `answer` | required, 10–2000 chars |
| `category` | free-form tag (e.g. booking), default general |
| `destinationId` / `tripId` | optional refs; never both |
| `displayOrder` | integer ≥0, sort key |
| `published` | boolean, default false; only published are public |

Indexes: `{published, displayOrder}`; `destinationId`; `tripId`; category.
Duplicate questions in the same scope are rejected (409, case-insensitive).

### TripMedia — IMPLEMENTED
`TripMedia` — `{tripId, userId, mediaType: photo|video, publicId, secureUrl, url, thumbnailUrl, width, height, format, bytes, altText, caption, published, displayOrder}`. Public only when `published:true`.

### Traveller — IMPLEMENTED (saved travellers)
`server/src/models/Traveller.js`. A user's saved traveller used to prefill the
booking wizard. Fields: `userId` (ref, indexed), `firstName`, `lastName`,
`email`, `phone`, `countryCode`, `gender?`, `dateOfBirth?`, timestamps.
Strict ownership: every query includes `userId`; other users' travellers are
404. Booking data is always **copied** into the booking snapshot at creation —
editing or deleting a saved traveller never changes existing bookings.

### Booking — IMPLEMENTED
A confirmed/cancelled reservation for a batch.
`server/src/models/Booking.js`. Chain:
`Booking → TripBatch → Trip → Destination`.

| Field | Type | Notes |
| ----- | ---- | ----- |
| `bookingCode` | String | required, **unique**, server-generated (`BK-000001`), immutable |
| `userId` | ObjectId (ref User) | required; owner — every customer read is scoped to it |
| `tripId` / `tripBatchId` | ObjectId (refs) | required; batch is the booked departure |
| `customerName/customerEmail/customerPhone/countryCode` | String | booking contact (prefilled from the account client-side) |
| `travellers[]` | `[{ firstName, lastName, gender?, dateOfBirth?, phone?, email? }]` | embedded; no sensitive documents collected |
| `travellerCount` | Number | 1–20; must equal `travellers.length` |
| `unitPrice` / `subtotal` / `discountAmount` / `totalAmount` / `currency` | Numbers | **immutable price snapshot** computed server-side at creation (`total = subtotal − discount`; discount only when `originalPrice > price`) |
| `status` | String enum | `pending \| confirmed \| payment_pending \| cancelled \| completed`, default `pending` |
| `paymentStatus` | String enum | `unpaid \| pending \| paid \| failed \| refunded`, default `unpaid` |
| `idempotencyKey` | String | client-generated per flow; compound unique index `{ userId, idempotencyKey }` makes duplicate submissions impossible |
| `cancelledAt` / `cancelledBy` | Date / ObjectId | set by the cancel endpoints |

Indexes: unique `bookingCode`; unique `{ userId, idempotencyKey }` (partial);
`userId`; `tripBatchId`; `createdAt` desc; `status`.

> Seat safety: creating a booking atomically increments the batch's
> `bookedSeats` via a conditional update that can only succeed while seats
> remain; cancelling releases them atomically. See
> `docs/BOOKING_SYSTEM.md` and ADR-016.

### Enquiry — IMPLEMENTED (Phase 27)
`server/src/models/Enquiry.js`. A contact / custom-trip / quote request from a
website visitor (public lead, no login required).

| Field | Notes |
| ----- | ----- |
| `name` / `email` / `phone` | required, trimmed; phone is a 10-digit Indian mobile (`6-9` prefix), `countryCode` defaults `+91` |
| `destinationId` | ref → published Destination (validated server-side; snapshot stored in `destinationName`) |
| `destinationName` | snapshot of the destination name at submission time |
| `source` | channel enum: `website \| custom_trip \| contact_form \| trip_page \| destination_page`, default `website`; the "Plan Your Dream Trip" modal uses `custom_trip` |
| `message` | optional free text |
| `status` | `new \| in-progress \| resolved`, default **new** (admin triage) |
| `userId` | optional ref — set when an authenticated visitor submits (attribution; admin-only, never exposed publicly) |

Indexes: `{ status, createdAt }`, `source`, `destinationId`. Admin triage is
covered in `docs/ADMIN.md`; API in `docs/API.md`.

### Review — IMPLEMENTED
`server/src/models/Review.js`. A moderated, verified review written by a user
with a CONFIRMED or COMPLETED booking for the trip.

| Field | Notes |
| ----- | ----- |
| `userId` / `tripId` / `bookingId` | required refs; booking proves eligibility |
| `rating` | 1–5 integer |
| `title` / `text` | 3–150 / 10–2000 chars |
| `status` | `pending \| approved \| rejected`, default **pending** (moderated) |
| `travellerName` | snapshot from the booking at creation |
| `batchDepartureDate` | nullable metadata |
| `moderatedAt` / `moderationNote` | admin audit fields |

Indexes: unique `{ userId, tripId }` (one review per user per trip);
`{ tripId, status, createdAt }` for public listing. Rating summaries
(average/total/distribution) are computed by aggregation over approved reviews
— never stored on Trip.

### Blog — IMPLEMENTED
`server/src/models/Blog.js`. A published travel article, optionally linked to a
Destination.

| Field | Notes |
| ----- | ----- |
| `title` / `slug` | slug unique, server-generated (suffix on collision), preserved on update unless explicitly changed |
| `excerpt` | 10–400 chars, shown on cards |
| `content[]` | **structured blocks** (ADR-020): `heading{level,text}` / `paragraph{text}` / `list{items[]}` / `image{url,alt,caption}` / `quote{text}` |
| `coverImage` | `{ url, publicId, alt }` — S3 object URL + key for new uploads |
| `category` | enum from `utils/blogCategories.js`: travel-guide, things-to-do, places-to-visit, trekking, shopping |
| `tags[]` | free-form, indexed |
| `destinationId` | optional ref → destination-specific browsing (`/blogs/:slug`) |
| `author` | display string set server-side from the creating admin user |
| `readingTime` | minutes, computed server-side (~200 wpm) |
| `published` / `featured` / `publishedAt` | publishing controls; `publishedAt` maintained by the service |
| `seoTitle` / `seoDescription` | per-article overrides |

Indexes: unique `slug`; `{published, featured, publishedAt}`; text index on
title/excerpt/tags; category/destination indexes. `createdBy/updatedBy`
audit refs are server-controlled and stripped from API output.

### Review — IMPLEMENTED

### FAQ
A frequently asked question.
- `question`, `answer`
- `tripId`? (optional; global otherwise)
- `category`?

### Coupon
A discount code.
- `code`, `type` (percent/fixed), `value`
- `validFrom`, `validUntil`
- `maxUses`, `usedCount`, `minAmount`

### Media
A reusable media asset (S3-backed).
- `publicId`, `url`, `secureUrl`
- `format`, `width`, `height`, `bytes`
- `folder`, `tags`, `altText`

### Payment
A payment transaction.
- `bookingId`, `userId`
- `provider` (Razorpay), `providerOrderId`, `providerPaymentId`
- `amount`, `currency`
- `status` (e.g. `created`, `paid`, `failed`, `refunded`)
- `metadata`

### Wishlist
A saved trip by a user.
- `userId`, `tripId`
- `createdAt` (unique per user+trip)

### Notification
An in-app/email notification for a user.
- `userId`, `type`, `title`, `body`
- `read`, `data`

### AppSetting — IMPLEMENTED (Phase 28/29, settings)
`server/src/models/AppSetting.js`. Centralized application settings — one
document per `key` with an arbitrary `data` payload.

| Key | `data` shape |
| --- | ------------ |
| `branding` | `{ logo: { url, publicId, alt, updatedAt } }` |
| `contact` | `{ phone, showPhoneInHeader }` |
| `promotionalBanner` | `{ enabled, message, ctaText, ctaUrl, shimmerEnabled, dismissible, backgroundColor, textColor }` |

No image binary is stored in MongoDB — only metadata/reference. The default
fallback logo `client/public/logo.jpg` is never stored or modified. Defaults
for `contact` (`phone: ''`, `showPhoneInHeader: false`) and
`promotionalBanner` (enabled, "Early Bird Sale — Save on upcoming group trips",
"Explore trips" → `/trips`, shimmer on) guarantee a fresh database still renders
correctly. See `docs/API.md` for the settings endpoints.

## Conventions

- Use Mongoose models in `server/src/models/`.
- Reference documents with `ref` and populate where appropriate.
- Keep the `Destination → Trip → TripBatch → Booking → Traveller` chain clear.
- Never hardcode travel products; always database-driven.
- Avoid destructive database operations without approval.
