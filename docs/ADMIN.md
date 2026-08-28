# ADMIN

Admin/CMS for **24x7Chhutti**. The **admin foundation** (layout, sidebar,
header, dashboard, RBAC) is implemented. Individual sections are placeholders
until their respective milestones.

## Access model

- Admin area lives at `/admin`.
- **Frontend guard** (`RequireAdmin`): UX only — redirects unauthenticated
  visitors and non-admin users to `/`.
- **Backend enforcement** (the real security boundary): every `/api/admin/*`
  route requires `requireAuth` + `requireRole('admin')`.

```
Public Routes  →  PublicLayout
Admin Routes   →  RequireAdmin (frontend guard)
                  →  AdminLayout
                  →  Admin pages
Backend:       /api/admin/*  →  requireAuth → requireRole('admin') → controller → service
```

### Roles
- `user` — default customer role; **cannot** access `/admin`.
- `staff` — represented in the architecture; granular permissions later.
- `admin` — full access to `/admin`.

Role constants live in `server/src/utils/roles.js` (`ROLES`, `ADMIN_ROLES`).
The role is read from the **server-verified** user (loaded from the DB by the JWT
`sub`); a client-supplied role is never trusted.

## Layout

```
<AdminLayout>
  <AdminSidebar />        (desktop, lg+)
  <MobileAdminSidebar />  (Sheet drawer, <lg)
  <div>
    <AdminHeader />       (mobile trigger, breadcrumb, current user, logout)
    <main><Outlet /></main>
  </div>
</AdminLayout>
```

Components in `client/src/components/admin/`:
- `AdminLayout.jsx` — responsive shell composing sidebar + header + main.
- `AdminSidebar.jsx` — desktop aside + mobile drawer; nav driven by
  `client/src/lib/adminNav.js` (single source of truth).
- `AdminHeader.jsx` — mobile sidebar trigger, breadcrumb/page title, current
  user, logout.
- `RequireAdmin.jsx` — frontend route guard (uses existing `useAuth()`).

## Sidebar sections

Built from `client/src/lib/adminNav.js`:

- **Dashboard** (`/admin`)
- **Content**: Destinations, Trips, Trip Batches, Blogs, FAQs
- **Commerce**: Bookings, Customers, Enquiries, Coupons
- **Engagement**: Reviews, Media
- **System**: Users, Settings

Items whose features are not implemented render `AdminPlaceholderPage` (clearly
marked "not implemented yet").

## Blogs — IMPLEMENTED

Manage travel stories at `/admin/blogs`:

- **List** (`AdminBlogsPage`): cover thumb, title/slug, category, reading time,
  publish state + date, destination, Featured badge; actions Feature toggle /
  Publish–Unpublish / Edit / Delete (confirmation dialogs).
- **Create/Edit** (`/admin/blogs/new`, `/admin/blogs/:id/edit`) via shared
  `BlogForm` (React Hook Form + Zod): title, auto-slug, excerpt, category,
  optional destination, tags, cover image URL + preview, **structured content
  block editor** (headings/paragraphs/lists/image URLs/quotes with reorder),
  SEO fields, featured + published toggles. Author, reading time and audit
  fields are server-managed.

## Reviews — IMPLEMENTED

Moderate traveller reviews at `/admin/reviews`:

- **List** (`AdminReviewsPage`): status filter pills (All/Pending/Approved/
  Rejected), cards showing stars, title, excerpt, trip, traveller name, date,
  moderation badge.
- **Actions**: Approve / Reject / Unpublish (each with a confirmation dialog
  explaining visibility impact) and Delete (permanent). Only approved reviews
  are public; summaries recompute automatically via aggregation.

## FAQs — IMPLEMENTED

Manage at `/admin/faqs` (Content → FAQs):

- **List**: search, scope (Global/Destination/Trip) + Published/Draft filters,
  cards with question/answer excerpt, badges, order value. Actions: Move up/down
  (displayOrder), Publish/Unpublish, Edit, Delete (confirmation dialogs).
- **Create/Edit** (`/admin/faqs/new`, `/admin/faqs/:id/edit`) via shared
  `FaqForm` (RHF+Zod): question, answer, category, scope-aware destination/trip
  selectors, displayOrder, published toggle.

## Bookings — IMPLEMENTED

Manage bookings at `/admin/bookings`:

- **List** (`AdminBookingsPage`): code, customer, trip, departure, travellers,
  total, payment badge, status badge, created date. Search (code/customer/
  email/phone/trip) + status filter; desktop table / mobile cards.
- **Actions**: View (detail page), Change status (dialog: pending/confirmed/
  payment_pending/completed), Cancel (confirmation dialog — releases the
  reserved seats immediately).
- **Detail** (`/admin/bookings/:id`, `AdminBookingDetailPage`): customer info,
  traveller list, trip + batch references, the immutable price snapshot
  (unit/subtotal/discount/total), payment + booking status, timestamps, and a
  guarded cancel action.

## Dashboard

`/admin` (the index route) shows real metric cards:

- Destinations, Trips, Upcoming/Open/Full Batches, Total/Pending/Confirmed
  Bookings, Payment Pending, Enquiries.

Values come from `GET /api/admin/dashboard`. All metrics are real database
counts (including enquiries since Phase 27) — **no fabricated statistics**.
Loading (skeleton), error, and empty states are handled.

## Enquiries — IMPLEMENTED (Phase 27)

`/admin/enquiries` (`AdminEnquiriesPage`) shows custom-trip / website lead
requests submitted through the public "Plan Your Dream Trip" modal and the
contact channel:

- Each card shows the lead's name, destination (from the snapshot +
  populated destination), phone, email, source badge (Custom trip), status
  badge, and created date.
- Inline status dropdown (`new` → `in-progress` → `resolved`) updates the
  record via `PATCH /api/admin/enquiries/:id/status`.
- Filters: status, source, and search (name/email/phone/destination).
- Delete with confirmation (`DELETE /api/admin/enquiries/:id`).
- RBAC unchanged: `/api/admin/*` requires auth + admin role (401/403).

## Destinations — IMPLEMENTED

Manage destinations at `/admin/destinations`:

- **List** (`AdminDestinationsPage`): desktop table / mobile stacked cards with
  image, name, country, status (Published/Draft badge), featured badge, starting
  price, updated date, and actions.
- **Actions**: View (opens public page in a new tab), Edit, Publish/Unpublish,
  Delete (with a confirmation dialog — no one-click delete).
- **Create** (`/admin/destinations/new`) and **Edit**
  (`/admin/destinations/:id/edit`) use the shared `DestinationForm`
  (React Hook Form + Zod). Fields: name, slug (auto from name if blank),
  country, region, type, short description, description, hero image URL + alt,
  gallery (add/remove rows), starting price, currency, featured, display order,
  SEO fields, and published.
- Publishing: `Draft → Published` / `Published → Draft` via dedicated endpoints;
  the list updates immediately (TanStack Query invalidation). Drafts are
  invisible on the public site.

## Trips — IMPLEMENTED

Manage trips at `/admin/trips`:

- **List** (`AdminTripsPage`): desktop table / mobile stacked cards with hero
  image, trip name, trip code, destination, trip type, duration, starting price,
  status (Published/Draft), featured badge, and actions.
- **Actions**: View (opens public page in a new tab), Edit, Publish/Unpublish,
  Delete (confirmation dialog). **Deleting a published trip is blocked** (backend
  returns an error; the UI tells you to unpublish first).
- **Create** (`/admin/trips/new`) and **Edit** (`/admin/trips/:id/edit`) use the
  shared `TripForm` (React Hook Form + Zod), organised into sections:
  Basic Information (destination selector loaded from the published-destinations
  API, trip name, read-only trip code in edit, trip type, slug), Duration,
  Pricing, Media, Itinerary (builder), Inclusions, Exclusions, Important
  information, FAQs, Discovery, SEO, and Publishing.
- **Itinerary builder**: add / remove / move days; each day has day number,
  title, description, activities, meals, accommodation, and notes.
- Publishing: `Draft → Published` / `Published → Draft`; the list updates
  immediately via TanStack Query invalidation. Drafts are invisible publicly.

## Trip Batches — IMPLEMENTED

Manage departures at `/admin/trip-batches` (sidebar: Content → Trip Batches):

- **List** (`AdminTripBatchesPage`): desktop table / mobile stacked cards with
  batch code, trip (+ destination), departure, return, price (with original
  price strikethrough and derived discount), seats Total/Booked/Available,
  status badge, published badge, updated date, and actions.
- **Actions**: Edit, Publish/Unpublish, Change Status (dialog with the six
  statuses), Delete (confirmation dialog). **Deleting a batch with booked
  seats is blocked** (client-side toast + backend 400) since future bookings
  will reference it.
- **Create** (`/admin/trip-batches/new`) and **Edit**
  (`/admin/trip-batches/:id/edit`) share `TripBatchForm`
  (React Hook Form + Zod). Sections: Trip (selector listing real trips with
  name, destination and trip code; read-only batch code in edit), Dates
  (departure/return + optional booking window), Pricing (price, original
  price, currency), Capacity (total/booked with a **live available-seats
  readout**, `bookedSeats ≤ totalSeats` enforced), Status & publishing, Notes.
- Cross-field validation (return after departure, price ≤ originalPrice,
  booking close ≥ open) runs client-side via the Zod schema AND server-side on
  merged values for PATCHes.
- Publishing a batch makes it eligible for public display together with its
  status (`open`/`full`) and a future departure date.

### Admin API

Base: `/api/admin` (all endpoints protected by `requireAuth` +
`requireRole('admin')`).

| Method | Path              | Purpose                    | Status     |
| ------ | ----------------- | -------------------------- | ---------- |
| GET    | `/api/admin/dashboard` | Dashboard summary       | IMPLEMENTED (destinations + trips counted) |
| GET    | `/api/admin/destinations` | List (draft + published) | IMPLEMENTED |
| GET    | `/api/admin/destinations/:id` | Detail              | IMPLEMENTED |
| POST   | `/api/admin/destinations` | Create destination     | IMPLEMENTED |
| PATCH  | `/api/admin/destinations/:id` | Update destination  | IMPLEMENTED |
| DELETE | `/api/admin/destinations/:id` | Delete destination  | IMPLEMENTED |
| PATCH  | `/api/admin/destinations/:id/publish` | Publish        | IMPLEMENTED |
| PATCH  | `/api/admin/destinations/:id/unpublish` | Unpublish      | IMPLEMENTED |
| GET    | `/api/admin/trips` | List (draft + published)      | IMPLEMENTED |
| GET    | `/api/admin/trips/:id` | Detail (populated destination) | IMPLEMENTED |
| POST   | `/api/admin/trips` | Create trip                    | IMPLEMENTED |
| PATCH  | `/api/admin/trips/:id` | Update trip                | IMPLEMENTED |
| DELETE | `/api/admin/trips/:id` | Delete trip (published → 400) | IMPLEMENTED |
| PATCH  | `/api/admin/trips/:id/publish` | Publish                | IMPLEMENTED |
| PATCH  | `/api/admin/trips/:id/unpublish` | Unpublish            | IMPLEMENTED |
| GET    | `/api/admin/trip-batches` | List batches                | IMPLEMENTED |
| GET    | `/api/admin/trip-batches/:id` | Batch detail (populated trip) | IMPLEMENTED |
| POST   | `/api/admin/trip-batches` | Create batch                | IMPLEMENTED |
| PATCH  | `/api/admin/trip-batches/:id` | Update batch            | IMPLEMENTED |
| DELETE | `/api/admin/trip-batches/:id` | Delete batch (booked → 400) | IMPLEMENTED |
| PATCH  | `/api/admin/trip-batches/:id/publish` | Publish          | IMPLEMENTED |
| PATCH  | `/api/admin/trip-batches/:id/unpublish` | Unpublish      | IMPLEMENTED |
| PATCH  | `/api/admin/trip-batches/:id/status` | Change status     | IMPLEMENTED |

Server structure (`server/src/routes/admin.routes.js` → `admin.controller.js` →
`admin.service.js`) is clean, so future admin APIs (bookings, etc.) can be
added without restructuring.

## Security / error handling

- Unauthenticated `/api/admin/*` → **401** `{ success:false, message:"Not authenticated" }`
- Authenticated non-admin → **403** `{ success:false, message:"Forbidden: ..." }`
- Unknown admin route → **404** (central `notFound`)
- Sensitive implementation details are not exposed.

## Status
- **Implemented:** admin foundation, RBAC (requireRole), layout, sidebar,
  header, dashboard, route guards, **destination management**, **trip
  management** (list/create/edit/publish/unpublish/delete with itinerary,
  inclusions/exclusions, FAQs), **trip batch management** (departure CRUD,
  pricing, capacity, booking window, status workflow, publish/unpublish,
  delete safety), destination + trip + trip-batch admin APIs, **enquiries**
  (list/status/delete for custom-trip leads, Phase 27).
- **Planned (placeholders):** Bookings, Customers, Reviews, Blogs,
  FAQs, Coupons, Media, Users, Settings.