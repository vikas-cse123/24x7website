# ROADMAP

Phased roadmap for **24x7Chhutti**. Check items off only when actually
implemented and verified.

## Phase 0 — Foundation
- [x] Project initialization
- [x] Documentation
- [x] Frontend foundation
- [x] Backend foundation
- [x] MongoDB configuration

## Phase 1 — Authentication
- [x] Login/signup (mobile-number OTP)
- [x] OTP
- [x] User accounts
- [x] JWT
- [x] HTTP-only cookies
- [ ] Roles (role field exists; RBAC not yet applied to routes)
- [ ] Protected routes (auth middleware exists; feature routes come later)

## Phase 2 — Design System & Public Website Shell
- [x] Design system (tokens, typography, spacing, radius, shadows, container)
- [x] Public layout (`PublicLayout`)
- [x] Header (logo, search, nav, login/authenticated state)
- [x] Desktop navigation (with "More" dropdown)
- [x] Mobile navigation (drawer)
- [x] Footer
- [x] Header authentication integration (existing LoginModal)
- [x] Basic public routing (placeholder pages for future routes)
- [x] Home page shell

## Phase 3 — Admin Foundation
- [x] Admin layout (AdminLayout, sidebar, header)
- [x] Dashboard (structural cards; zeroed counts until data exists)
- [x] Admin authentication (uses existing OTP auth; RequireAdmin guard)
- [x] Permissions (RBAC foundation: requireAuth + requireRole('admin'))

## Phase 4 — Destinations
- [x] Destination CRUD (model, API, admin list/create/edit/delete)
- [x] Destination pages (public listing + detail)
- [x] SEO (dynamic title/meta/canonical via useSeo)
- [x] Publishing (draft/published, admin toggle, public excludes drafts)

## Phase 5 — Trips
- [x] Trip CRUD (model, API, admin list/create/edit/delete)
- [x] Itinerary builder
- [x] Inclusions / Exclusions
- [x] Gallery
- [x] FAQs
- [x] Public trip listing + detail pages, SEO
- [x] Destination → Trip connection on the public destination page

## Phase 6 — Trip Batches
- [x] Batch CRUD (model, API, admin list/create/edit/delete)
- [x] Availability (totalSeats/bookedSeats; derived availableSeats)
- [x] Batch pricing (price + originalPrice, derived discount)
- [x] Booking window (open/close dates) + status workflow
- [x] Public upcoming departures on trip pages + homepage cards
- [x] Real dashboard batch statistics

## Phase 7 — Public Website (content)
- [x] Homepage content (Capture A Trip-style homepage built from real data)
- [x] Destination pages (done in Phase 4 — kept here for roadmap continuity)
- [x] Trip listing → upgraded into the Capture A Trip-style discovery page
      (`/trips`: search, destination tabs, trip type, domestic/international,
      budget, departure-date filters, sorting, chips, URL state, pagination)
- [x] Trip detail (done in Phase 5 — kept here for roadmap continuity)
- [x] Search (server-side across trip name/code/destination; advanced engine later)
- [x] Filters — basic destination/tripType/featured/category done + batch-aware
      budget/departure-date filters; faceted counts/advanced filters later

## Phase 8 — Booking
- [x] Batch selection (Book Now per departure on the trip page)
- [x] Traveller count + traveller details (URL-preserved wizard, auth gate)
- [x] Pricing (server-computed snapshot; client estimate labelled)
- [x] Booking (atomic seat reservation, idempotency, cancellation)
- [x] Confirmation page (/booking/BK-xxxxxx, "Payment pending")

## Phase 8b — Customer Account & Travellers (implemented post-booking)
- [x] /account shell (auth-gated, noindex) with Profile / My Bookings /
      Travellers sections + header/mobile user menu links + logout
- [x] Profile read/update (name+email; mobile is login identity, read-only)
- [x] My Bookings list (status filters, pagination), owner-only booking detail,
      cancellation reusing the Phase 9 API
- [x] Saved travellers CRUD with strict ownership
- [x] Booking wizard quick-fill from saved travellers (copied into snapshot)

## Phase 9 — Payments
- [ ] Razorpay
- [ ] Payment verification
- [ ] Payment status

## Phase 10 — Content
- [x] Travel blogs (model + public listing/search/categories/destination
      browsing/detail with related posts; homepage section; full admin CRUD
      with structured block editor, publish/feature workflows)
- [x] Reviews & ratings (verified-booking eligibility, one per user/trip,
      moderation workflow, rating summary aggregation, trip-page section,
      My Account reviews, admin management)
- [x] FAQs — CMS (global / destination / trip scopes, priority merge
      trip→destination→global, admin CRUD + publish/reorder, public
      visibility by displayOrder)
- [x] Gallery (Trip hero+traveler media, lightbox, Cloudinary)

## Phase 13 — FAQ CMS
- [x] Global / Destination / Trip FAQ model with displayOrder + publish
- [x] Public APIs: /api/faqs, /api/destinations/:slug/faqs,
      /api/trips/:slug/faqs (priority merge, dedup, drafts hidden)
- [x] Homepage FAQ CMS (real data, accordion, empty state)
- [x] Destination + Trip page FAQs (priority merge, dedup)
- [x] Admin FAQ management (/admin/faqs: CRUD, publish, reorder, scope filters)
- [x] Responsive 320–1440, build, regression, logo unchanged

## Phase 15 — Wishlist / Favorites
- [x] Wishlist model + unique constraint
- [x] Add/remove wishlist (trip & destination)
- [x] Heart button on cards/pages
- [x] Account wishlist page

## Phase 17 — Notifications
- [x] Notification model + events (booking/departure/review)
- [x] Header bell + unread badge + dropdown
- [x] Account notifications page
- [x] Booking/TripBatch/Review service integration + dedupe

## Phase 18 — Capture A Trip UI/UX completion + final gap audit
- [x] Gap audit vs Capture A Trip (nav, homepage, destination, trips, trip detail, booking, account, blogs, admin)
- [x] Real nav hierarchy (placeholders → real routes)
- [x] Homepage real reviews (approved reviews, recent endpoint)
- [x] Destination category tabs
- [x] Trip detail related-trips section
- [x] Hero real travel imagery + real /faqs page
- [x] Responsive 320–1440 + regression verification

## Phase 19 — Capture A Trip content pages + final public UX gaps
- [x] About page (/about) — hero, who we are, value prop, why choose us, CTA
- [x] Contact page (/contact) — info + RHF/Zod form (name/email/phone/message) with validation, success/error (no backend email infra)
- [x] Legal pages (/privacy-policy, /terms-and-conditions, /cancellation-policy) — readable, mobile/SEO-friendly, footer-linked
- [x] 404 page — travel-oriented, branded, Home/Trips CTAs, noindex
- [x] Blog category/tag filtering via URL query params (shareable, pagination-safe, combo with search)
- [x] Navigation/footer updated, dead placeholders replaced, responsive 320–1440, SEO, build + regression

## Phase 20 — Final production readiness + Capture A Trip clone QA
- [x] Performance: route lazy loading (React.lazy+Suspense) + manualChunks → initial 53 kB vs 862 kB, no >500 kB chunk
- [x] SEO audit: og:url + twitter metadata, robots.txt, sitemap.xml, canonical/noindex, filtered URLs noindex-safe
- [x] Security audit: headers, CORS, cookies, RBAC, owner scoping, ObjectId/Zod, upload 5 MB + image/*, Cloudinary travel-crm/ guard, prod error hiding, no secrets exposed
- [x] API reliability: consistent 400/401/403/404/409/500, validation, pagination limits, empty/error states
- [x] Image audit: f_auto/q_auto/srcSet/lazy/fallback retained, no local storage
- [x] Responsive QA 320–1440 all key pages, no overflow, tappable booking, modals fit
- [x] Error/empty/loading states, no blank screens
- [x] Capture A Trip clone QA (header/home/trips/trip/destination/account/blogs)
- [x] Regression + production build verified, DB safety (no destructive ops)

## Phase 11 — Production (remaining post-20)
- [x] SEO (Phase 20 complete)
- [x] Performance (Phase 20 complete)
- [x] Security (Phase 20 audited/hardened)
- [ ] Analytics
- [ ] Error monitoring (Sentry etc.)
- [ ] Production deployment (CDN, domain, monitoring)