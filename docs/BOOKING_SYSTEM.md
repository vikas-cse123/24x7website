# BOOKING_SYSTEM

The customer booking flow for **24x7Chhutti** — **IMPLEMENTED (Phase 9)**.
Payments are NOT integrated yet (Phase 10): every booking is created with an
explicit **"Payment pending"** state and no payment is ever faked.

## Implemented flow

```
Trip detail (/trip/:slug)
   ↓  Book Now on a departure row
Booking wizard (/booking/:tripSlug?batch=<id>)
   1. Traveller count        (stepper, capped by TripBatch.availableSeats)
   2. Traveller details      (names per traveller) + booking contact
   3. Review summary         (estimate clearly labelled)
   ↓  Confirm booking
Confirmation (/booking/BK-xxxxxx)
```

- Departure selection happens on the trip page: each `TripDepartures` row's
  Book Now links to `/booking/<trip-slug>?batch=<batchId>` — the selection
  therefore lives in the URL and survives login interruptions and refreshes.
- Booking requires authentication. Unauthenticated visitors get a "Login to
  continue" panel and the existing global LoginModal opens automatically; the
  wizard resumes from the same URL after login. No second auth system exists.

## Data model

`server/src/models/Booking.js`:

| Field | Notes |
| --- | --- |
| `bookingCode` | server-generated (`BK-000001`), unique, immutable |
| `userId` | owning user; all customer reads are scoped to it |
| `tripId`, `tripBatchId` | refs; chain `Booking → TripBatch → Trip → Destination` |
| `customerName/customerEmail/customerPhone/countryCode` | booking contact |
| `travellers[]` | `{ firstName, lastName, gender?, dateOfBirth?, phone?, email? }` |
| `travellerCount` | 1..20, must equal `travellers.length` |
| `unitPrice` | batch price per traveller **at booking time** |
| `subtotal` | unitPrice × travellerCount |
| `discountAmount` | `(originalPrice − price) × count` when a real discount exists |
| `totalAmount` | subtotal − discountAmount |
| `currency` | from the batch (default INR) |
| `status` | `pending \| confirmed \| payment_pending \| cancelled \| completed` |
| `paymentStatus` | `unpaid \| pending \| paid \| failed \| refunded` |
| `idempotencyKey` | client-generated per flow; unique per user (compound index) |

**Price snapshot:** all pricing fields are computed by the SERVER from the
TripBatch at creation time and are immutable afterwards. Later batch price
changes never affect existing bookings, and historical totals are never derived
from current batch prices. Client-supplied `price/subtotal/totalAmount/unitPrice`
are ignored entirely.

## Lifecycle

```
            POST /api/bookings
                  ↓
              pending  ── admin sets ──→  confirmed ⇄ payment_pending
                  │                            │
             user/admin cancel            completed (admin, after travel)
                  ↓
              cancelled   (terminal)
```

- New bookings start `pending` + paymentStatus `unpaid`.
- Admin can move bookings between `pending / confirmed / payment_pending /
  completed` via `PATCH /api/admin/bookings/:id/status`. The `cancelled`
  status is intentionally NOT settable there — cancellation must go through
  the cancel endpoints so seats are released atomically.
- Cancellable states: `pending`, `confirmed`, `payment_pending` (owner or
  admin). Cancelling a `paid` booking flips paymentStatus to `refunded`
  (preparation only — real refunds arrive with the payment gateway).

## Seat reservation & concurrency (critical)

Seat safety is enforced by the DATABASE, never by JavaScript checks:

```js
const reserved = await TripBatch.findOneAndUpdate(
  { _id, $expr: { $lte: ['$bookedSeats', { $subtract: ['$totalSeats', count] }] } },
  { $inc: { bookedSeats: count } },
  { new: true }
)
if (!reserved) → 409 "Only N seats are currently available."
```

- `findOneAndUpdate` is atomic per document: concurrent bookings serialize on
  the batch document and the condition can only pass while seats genuinely
  remain. Overselling is impossible even under parallel requests
  (verified: 3 parallel single-traveller bookings on a 2-seat batch → exactly
  2 succeed).
- The booking document is created AFTER the reservation succeeds. If anything
  fails afterwards (validation, duplicate idempotency key, unexpected error),
  the reservation is compensated (`$inc: −count`) **exactly once** before the
  request errors/replays, so seats are never lost without a booking and never
  double-released.
- Standalone MongoDB (dev) has no multi-document transactions; the conditional
  update + exactly-once compensation pattern is the chosen equivalent. When
  production runs a replica set this can be upgraded to a transaction without
  changing callers (documented in ADR-016).

### Idempotency

The wizard generates one `idempotencyKey` (UUID) per flow. The compound unique
index `{ userId, idempotencyKey }` makes duplicates impossible:

- Double clicks / network retries send the same key → the insert hits E11000 →
  the reservation is compensated and the ORIGINAL booking is returned.
- Concurrent same-key requests: the loser rolls its reservation back and
  returns the winner's booking — verified net seat change equals travellerCount.
- Keys are scoped per user; another user's key never collides.

A `bookingCode` race (two concurrent creates deriving the same next code) is
handled by regenerating on a `bookingCode_1` unique-index collision and
retrying the insert (up to 5 attempts). Seats are not touched during retries.

## Bookability rules (server-enforced)

A batch can be booked only when ALL hold:
- exists, `published = true`
- `status ∈ {open, full}` — wait, `full` means sold out in practice; the seat
  guard rejects any positive request against 0 available seats
- `departureDate > startOfTodayUtc()` (future)
- booking window: `bookingOpenDate ≤ now` and `bookingCloseDate ≥ today` when set
- `requested travellers ≤ availableSeats` (atomic guard above)

## Cancellation

1. Status-guarded flip: `findOneAndUpdate({_id, status ∈ cancellable},
   {status:'cancelled', ...})` — a booking can only ever be cancelled once.
2. Seat release: `updateOne({_id: batchId, bookedSeats: {$gte: count}},
   {$inc: {bookedSeats: -count}})` — atomic.
3. If the release fails (should not happen), the status flip is REVERTED so the
   system never ends up half-cancelled; the caller gets an error to retry.

## Security invariants

Users cannot change `bookingCode`, `userId`, any price field, the referenced
batch after creation, or `bookedSeats` directly; cannot see other users'
bookings (404, not 403 — no existence leak); cannot mark payments paid; cannot
confirm their own booking via client fields. All admin endpoints require
`requireAuth` + `requireRole('admin')`.

## API surface

Customer (all require auth):
- `POST /api/bookings`
- `GET /api/bookings`
- `GET /api/bookings/:id`
- `GET /api/bookings/code/:bookingCode`
- `POST /api/bookings/:id/cancel`

Admin (requireAuth + admin):
- `GET /api/admin/bookings` (search + status/payment filters)
- `GET /api/admin/bookings/:id`
- `PATCH /api/admin/bookings/:id/status`
- `PATCH /api/admin/bookings/:id/cancel`

## Payment preparation (Phase 10)

`paymentStatus` already models the gateway lifecycle. On payment success the
gateway integration should set `status='confirmed'` (+ `paymentStatus='paid'`);
on failure `paymentStatus='failed'`. Refund handling extends the cancel path.
No gateway code exists in this phase.
