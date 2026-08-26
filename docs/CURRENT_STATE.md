# CURRENT_STATE

> Handoff / checkpoint file for AI agents. Read this before continuing development
> and update it after every meaningful milestone.

## Current status
**PHASE 18 — CAPTURE A TRIP UI/UX COMPLETION + FINAL GAP AUDIT COMPLETE**

## Completed

### Phases 0–15 (foundation → wishlist)
All previous functionality re-verified: consolidated cross-phase regression
13/13, Phase 10 frontend 31/31 + backend 23/23, Phase 11 frontend 22/22 +
backend 26/26, Phase 12 frontend 31/31 + backend 21/21.

### FAQ CMS (Phase 13)
- **Model** `server/src/models/Faq.js`: reusable Q/A with `question` (5–300),
  `answer` (10–2000), `category` (free-form, default general), optional
  `destinationId` / `tripId` (mutually exclusive), `displayOrder`,
  `published`, timestamps. Unique duplicate check per scope (case-insensitive,
  same destination/trip/global) → 409. Indexes on published+displayOrder,
  destination, trip, category (**ADR-022**).
- **Public APIs**: `GET /api/faqs` (global published, ordered), `GET
  /api/destinations/:slug/faqs` (destination, 404 if unknown), `GET
  /api/trips/:slug/faqs` (priority-merged trip→destination→global, deduped by
  question, drafts hidden, each with `scope`). Published-only via service.
- **Admin APIs**: `GET/POST /api/admin/faqs`, `GET/PATCH/DELETE
  /api/admin/faqs/:id`, `PATCH .../publish|unpublish`, `POST .../reorder`
  (bulk displayOrder) — all behind requireAuth+admin; refs validated, audit
  fields server-controlled.
- **Homepage**: `HomepageFaqSection` now fetches global FAQs via TanStack Query;
  Capture A Trip-style accordion with loading skeletons and clean empty state
  (no fabricated data).
- **Destination page**: new `DestinationFaqs` section fetching
  `/destinations/:slug/faqs`; hidden when no FAQs for that destination.
- **Trip page**: embedded `trip.faqs` replaced by CMS FAQs via
  `/trips/:slug/faqs`; priority merge handled server-side, deduped, rendered
  with the existing `Accordion` component. Legacy `trip.faqs` remain in model
  but are no longer rendered publicly.
- **Admin UI**: `/admin/faqs` list with scope (Global/Destination/Trip) +
  Published/Draft filters, search, cards with scope/published badges and
  Move up/down (displayOrder), Publish/Unpublish, Edit, Delete (confirmations);
  shared `FaqForm` (RHF+Zod+shadcn) with scope-aware destination/trip
  selectors, displayOrder, published toggle; `/admin/faqs/new` and
  `/admin/faqs/:id/edit` pages.
- **Services**: `client/src/services/faqs.js` (`faqApi` + `adminFaqApi`).
- **Navigation**: Admin sidebar FAQs entry now live (already present, now
  functional); public nav unchanged (no duplicate /faqs index page per
  spec — FAQs stay on their contextual pages).

## Existing assets
- `logo.jpg` — official logo, SHA-1 `e4fc4cc…` re-verified unchanged.

## Not implemented (later)
- Payments/refunds (Razorpay) — next recommended phase
- Blog media CMS (Cloudinary uploads), video embeds, blog comments; gallery
  management; wishlist/notifications; change-phone flow

## Verification results (all actually performed)

### Backend — 24/24 phase checks (+ regressions)
RBAC (admin 401/403, no public write 404); validation (question <5 →400,
answer <10 →400, destination+trip together →400, invalid refs →400);
global FAQ create (published/category), duplicate same-scope →409;
ordering sorted by displayOrder; draft hidden; publish/unpublish toggles
public count 2→3→2; destination endpoint only its FAQs + 404 on unknown;
trip FAQs strict priority trip→destination→global with dedup and drafts
hidden; unknown trip 404; update preserves order; bulk reorder + reflected
order; delete; /api/health OK. (Two test-script issues fixed: question
length borderline and G3ID extraction; one real route mount bug fixed.)

### Frontend — 25/25 phase checks (+ regressions)
Homepage heading + real global FAQ content + accordion; trip page heading,
priority merge trip→destination→global deduped, draft hidden; accordion answer
visible for open item; destination page heading+content and trip-specific
exclusion + empty-state for destinations without FAQs; admin list loads and
shows real FAQs; Global scope filter isolates; draft filter; create via full
form (question/answer/category/scope/destination, published) → visible on
homepage; edit persists; unpublish hides; delete removes from admin and
public; reorder changes order; responsive no overflow 320–1440px on all FAQ
surfaces (homepage, trip, destination, admin); anon admin API 401.

### Regression + build
Production build succeeds; logo checksum unchanged. Existing suites to be
re-run as final step (see below). Prior consolidated regression 13/13 and
Phase 10/11 suites remain green; Phase 12 suites green.

### Wishlist / Favorites (Phase 15)
- **Model** `Wishlist` owner-scoped, unique `{userId, itemType, itemId}`, supports `trip` + `destination`, batch-populated list without N+1.
- **APIs** `POST/GET /api/account/wishlist`, `DELETE /api/account/wishlist/:type/:id` — auth, type/entity validation, duplicate 409, ownership 404, unpublished/deleted handled gracefully.
- **Frontend** — reusable `WishlistButton` (heart) on `TripCard`/`DestinationCard`/`TripPage` hero, guest opens `LoginModal`, instant toggle via TanStack Query, `/account/wishlist` with trips/destinations sections, loading/empty/error states.

### Trip Gallery + Traveler Media (Phase 16)
- **TripMedia model** + public/admin APIs (photo/video, published, displayOrder)
- **TripGallery** polished hero+2x2 grid, thumbnails, lightbox (Esc/prev/next), Cloudinary f_auto/q_auto responsive
- **Gallery by Travelers** tabs All/Photos/Videos with empty states, published-only
- **Admin Media** page per-trip filter, approve/unpublish/delete/reorder
- **Admin Trip gallery** now Cloudinary-native via ImageUploader (primary/ordering/replace, no asset delete on remove)

### Trip Gallery + Traveler Media — verification (Phase 16, this phase)
- Trip hero + 2x2 grid, count badge, thumbnails, lightbox (Esc/prev/next), Cloudinary f_auto/q_auto, legacy fallback, responsive 320–1440
- Traveler media Photos/All tabs show published photos, Videos tab empty state, unapproved hidden, admin filter/approve/delete/reorder
- Admin Trip gallery via ImageUploader (primary/ordering/replace, no asset delete on remove)

### Notifications (Phase 17)
- Notification model (userId/type/title/message/entity/readAt) + enums + indexes (userId+createdAt, userId+readAt, unique userId+eventKey)
- Reusable notification service + Booking/TripBatch/Review integration (fire-and-forget)
- APIs: list/unread-count/read/read-all/delete (all requireAuth)
- Header NotificationBell (unread badge, dropdown, Escape/outside-close, mobile drawer), /account/notifications page (loading/empty/error/pagination, mark read/all, delete)

### UI/UX completion (Phase 18)
- Nav retargeted to real pages: Group Trips/Upcoming Group Trips/Travel Styles → /trips, Deals → /trips?featured=true, Destinations as top-level item, real Blogs/FAQs/About/Contact under More
- Homepage Reviews section now shows real approved reviews (`GET /api/reviews/recent`, limit 3) with star ratings, traveller avatars and trip links
- Destinations page gained category tabs (All / International / Domestic / Weekend) mirroring the homepage explorer
- Trip detail page gained a "More trips in {destination}" related-trips section (excludes self)
- Homepage hero uses real featured-destination travel imagery with gradient overlay (logo fallback kept)
- `/faqs` is now a real page (global FAQ accordion) instead of a placeholder

## Known issues / notes
- Port 5000 held by macOS ControlCenter — dev servers run as API :5057 / web
  :5175 (`VITE_PROXY_TARGET` must match). MongoDB container may need
  `docker start chhutti-mongo` after Docker restarts.
- Demo data (real records, admin-editable): 4 global published FAQs
  (booking, solo, cancellation, group size) + 1 Vietnam destination + 1
  Vietnam 8 Days trip-specific + 1 draft; plus a temporary E2E FAQ
  created/deleted by the suite. Delete via admin to reset. Re-seeded after
  backend purge at suite start.
- Client bundle >500 kB warning persists (code-splitting deferred).

## Recommended next milestone
**Payments (Razorpay)** — booking model is payment-ready (`paymentStatus`
lifecycle, confirmed state). Then: gallery management, advanced search,
analytics.

## How to use this file
- Read it before starting work.
- Keep it accurate: mark only what is truly implemented and verified.
- Update it at the end of each meaningful milestone.
- Do not mark unfinished work as completed.
