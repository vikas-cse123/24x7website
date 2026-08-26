# CURRENT_STATE

> Handoff / checkpoint file for AI agents. Read this before continuing development
> and update it after every meaningful milestone.

## Current status
**PHASE 20 — FINAL PRODUCTION READINESS + CAPTURE A TRIP CLONE QA COMPLETE**

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

### Content pages + final UX gaps (Phase 19)
- **About** (`/about`): hero, who we are, how it works, WHY_CHOOSE_US reuse, trust/value proposition, CTA; branded, responsive, SEO canonical
- **Contact** (`/contact`): contact info (24×7 support, email, India, hours) + RHF+Zod form (name/email/phone/message) with validation, success/error state via Sonner, no backend email infra per spec
- **Legal**: `/privacy-policy`, `/terms-and-conditions` (alias `/terms` kept), `/cancellation-policy` with readable SEO-friendly content, breadcrumbs, linked from footer
- **404** (`*` route): travel-oriented design with branding, Back Home / Explore Trips CTAs, destination/blog/FAQ shortcuts, `noindex` via useSeo, responsive
- **Blog discovery**: `/blogs` now supports `?category=` (existing) + `?tag=` filtering with URL query params (shareable, refresh-safe, back/forward-safe); category pills, tag input + active chips, `Clear all`, `?tag` + `?category` + `?search` combinations, pagination preserves filters; `BlogDetailPage` tags link to filtered blogs, category link to filtered list; backend already supports `tag`/`category`/`search`/`destination`/`featured` via `listPublished`
- **Navigation/footer**: `lib/nav.js` legal links corrected (`/terms`→`/terms-and-conditions`, added `/cancellation-policy`), support/destinations groups expanded; routes now map to real pages instead of placeholders; unknown routes render `NotFoundPage`
- **SEO**: all new pages set title/description/canonical; 404 is `noindex, nofollow`; blogs canonical stays at unfiltered root to avoid duplicate filter URLs

## Verification results (Phase 19 — actually performed)
- **Build**: `npm run build --workspace client` succeeds (859→862 kB bundle, same >500 kB warning deferred)
- **Routes**: `/about`, `/contact`, `/privacy-policy`, `/terms-and-conditions` (`/terms` alias), `/cancellation-policy`, `/faqs`, `/blogs`, unknown route → styled 404 with CTA, all via React Router under PublicLayout
- **Blog filtering**: `?category=travel-guide` and `?tag=...` filter correctly (backend `listPublished` with `category`/`tag`); `?search+category+tag` combo works; pagination preserves filters via `setPage`; URL persistence verified (shareable, refresh/back-forward)
- **SEO**: About/Contact/Legal set title/description/canonical; 404 sets `noindex`; blogs canonical points to unfiltered `/blogs` (or `/blogs/:slug` for destination blogs) regardless of filters
- **Responsive**: 320/390/430/768/1024/1280/1440 no horizontal overflow on new pages (Container + grid + flex-wrap + overflow-x handling)
- **Navigation**: header More dropdown (Blogs/FAQs/About/Contact) and footer Support/Legal links verified; mobile drawer matches
- **Regression**: existing booking/account/wishlist/notifications/reviews/FAQs/trip/destination/blog suites remain green; no booking core touched

### Production readiness (Phase 20)
- **Performance**: route-level `React.lazy` + `Suspense` (`routes/index.jsx:1` — 29 lazy pages + fallback spinner) + `vite.config.js:19` `manualChunks` (vendor, vendor-router/query/forms/axios/zustand/icons/ui). Build before 862.86 kB single chunk → after initial `index-52FiEiXx.js 53.88 kB` + vendor `vendor-QaJ2r_E4.js 151.39 kB` + page chunks (Home 27.42 kB, TripPage 28.08 kB, etc.). No >500 kB initial chunk; gzip initial ~50 kB vs 226 kB before.
- **SEO**: `lib/seo.js:1` now sets `og:url` + `twitter:card/title/description/image`; `client/public/robots.txt` (Allow /, Disallow /admin/account/booking/api, Sitemap), `client/public/sitemap.xml` (10 static URLs, dynamic note). All public pages verified: `/`, `/destinations`, `/destination/:slug`, `/trips`, `/trip/:slug`, `/blogs`, `/blog/:slug`, `/faqs`, `/about`, `/contact`, legal, 404 noindex. Filtered/search URLs canonical to unfiltered root (ADR-015). Private `/account`, `/booking/*`, `/admin` are `noindex`.
- **Security**: `app.js:8` security headers (nosniff, DENY, Referrer-Policy, Permissions-Policy, HSTS in prod), `express.json({limit:'1mb'})`, CORS with `credentials:true` and `config.clientOrigin` allowlist, `cookie httpOnly/secure/sameSite` (`config/index.js:21`), RBAC `requireAuth`→`requireRole(...ADMIN_ROLES)` (`admin.routes.js:18`), owner scoping on all account/wishlist/notification/review services, ObjectId regex + Zod validators, `upload` fileFilter `image/*` + 5 MB limit (`upload.js:12`), `imageStorage.remove` prefix check `travel-crm/` (`upload.controller.js:32`), `errorHandler` hides 5xx in prod (`error.js:9`), no secrets committed (`.env.example` only), Cloudinary secret server-only (`config/cloudinary.js:3`).
- **API reliability**: 400 validation, 401 invalid session, 403 forbidden, 404 missing, 409 conflict, 500 generic in prod; empty results return `{items:[], total:0}` not 404; pagination max 50 (public) /100 admin; Malformed ObjectIds →400 via validators.
- **Images**: `cloudinary.js:1` `f_auto,q_auto,w_` + `srcSet` widths 320–1600, `DestinationImage.jsx:22` `loading="lazy"` + `sizes` + logo fallback + `onError`; no local storage, only `travel-crm/` prefix.
- **Responsive QA**: 320/390/430/768/1024/1280/1440 — Home hero, Trips filters/drawer, TripDetail gallery/lightbox, Destination, Blogs, BlogDetail, FAQs accordion, Booking wizard, Account/Wishlist/Notifications/Admin — no overflow/clip, modals fit, tappable controls.
- **Error states**: every data page has loading skeleton, empty dashed border, error banner with Retry (Trips `refetch`), 404 branded page, sold-out/full batch badges, cancelled booking states.
- **Regression**: consolidated verification via `GET /api/health` 200, `GET /api/destinations`/`trips`/`blogs`/`faqs` shape checks, auth 401, admin 403, owner-scoping checks, build success — all PASS.

## Known issues / notes
- Port 5000 held by macOS ControlCenter — dev servers run as API :5057 / web
  :5175 (`VITE_PROXY_TARGET` must match) on macOS; on Windows 5000/5173 are free. MongoDB container may need
  `docker start chhutti-mongo` after Docker restarts. API still serves `/api/health` when DB down (warns, 5000 listening).
- Demo data (real records, admin-editable): 4 global published FAQs
  (booking, solo, cancellation, group size) + 1 Vietnam destination + 1
  Vietnam 8 Days trip-specific + 1 draft; plus a temporary E2E FAQ
  created/deleted by the suite. Delete via admin to reset. Re-seeded after
  backend purge at suite start. No destructive seed run in Phase 20.
- Client bundle >500 kB fixed: Phase 20 lazy + manualChunks removes warning; remaining largest chunk is `vendor-QaJ2r_E4.js 151 kB` (react).

## Recommended next milestone
**Payments (Razorpay)** — booking model is payment-ready (`paymentStatus`
lifecycle, confirmed state). Do NOT implement in Phase 20 per spec. Next: email/SMS infrastructure, advanced gallery management, analytics, production deploy (env, CDN, monitoring).

## How to use this file
- Read it before starting work.
- Keep it accurate: mark only what is truly implemented and verified.
- Update it at the end of each meaningful milestone.
- Do not mark unfinished work as completed.
