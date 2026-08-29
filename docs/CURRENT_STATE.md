# CURRENT_STATE

> Handoff / checkpoint file for AI agents. Read this before continuing development
> and update it after every meaningful milestone.

## Current status
**PHASE 29 — REBUILD TOP HEADER + EDITABLE PROMOTIONAL BANNER**

### Phase 29 (header + admin-editable promotional banner — end-to-end)
> Phase numbering note: the admin-managed branding system is recorded below as
> Phase 28, so this header/banner milestone is Phase 29 to keep the timeline
> sequential.
- **Page structure fixed:** every public page now renders **Promotional banner →
  Main header → Navigation → content**. The banner is the very first element
  (full-width strip, `components/layout/PromoBanner.jsx`), mounted in
  `PublicLayout` above the sticky `Header`; it was previously a homepage-only
  section below the header.
- **Admin-editable promotional banner:** new `app_settings` documents
  `key: 'promotionalBanner'` → `data = { enabled, message, ctaText, ctaUrl,
  shimmerEnabled, dismissible, backgroundColor, textColor }`. Defaults (empty DB
  never breaks the site): enabled, "Early Bird Sale — Save on upcoming group
  trips", CTA "Explore trips" → `/trips`, shimmer on. CTA supports internal
  paths (router) and external http(s) links; unsafe schemes (`javascript:`/
  `data:`/`vbscript:`) are rejected server-side by Zod and guarded client-side.
- **White shimmer sweep:** CSS-only `banner-shimmer` animation in
  `styles/index.css` — an absolutely positioned, pointer-events-none translucent
  white band that sweeps LEFT → RIGHT, clipped by the banner's `overflow-hidden`.
  No layout shift, no horizontal scroll, no click interference, and it is
  disabled under `prefers-reduced-motion` and by the admin "Shimmer effect"
  toggle.
- **Banner dismissal:** the X close button hides the banner for the current
  browser session only (`sessionStorage`), never changing the global admin
  setting.
- **Main header rebuilt** (`components/layout/Header.jsx`): **logo (left,
  admin-managed branding, clickable → "/") | compact centered search | phone +
  Login (right)**. On mobile the search moves to a dedicated row below the logo
  so the top row never overflows. Logo uses the centralized branding system
  (Phase 28) — no hardcoded `/logo.jpg`.
- **Phone number:** new `key: 'contact'` setting →
  `data = { phone, showPhoneInHeader }`. `HeaderPhone` shows the number in the
  header row only when configured + enabled (`tel:` link). Default is empty
  (no real number exists in the project; none was invented).
- **Login button:** now just **"Login"** — dark/black pill (70–90px × 36–42px),
  opening the existing auth flow. "Login / Sign Up" removed everywhere
  (header, mobile nav, booking/account CTAs); the LoginModal heading keeps its
  descriptive "Login or Sign Up" title.
- **Header search:** compact pill (white bg, thin border, search icon left,
  "Search your trip..." placeholder, subtle focus), still navigates to
  `/trips?search=…`. Search backend/behaviour untouched.
- **Navigation row:** existing 24x7Chhutti nav items kept, now full-width and
  centered under the header with cleaner hover states. Mobile uses the existing
  drawer.
- **Public settings API:** `GET /api/settings` (no auth) returns the bundle
  `{ logo, contact, promotionalBanner }` (defaults applied) so the top area
  renders from one call. `GET /api/settings/branding` kept for back-compat.
- **Admin settings API (RBAC — requireAuth + admin at the parent router,
  unweakened):** `GET /api/admin/settings` (aggregate), `PATCH
  /api/admin/settings/contact`, `PATCH /api/admin/settings/promotional-banner`,
  plus the existing branding endpoints.
- **Admin UI:** `/admin/settings` now has three cards — **Branding** (existing),
  **Contact Information** (phone + "Show in header"), and **Promotional Banner**
  (show toggle, message, CTA text, CTA URL, shimmer toggle, live preview).
  Saving invalidates `['settings','public']`, `['admin','settings']` and
  `['branding']` so the public site updates immediately.
- **Database safety:** only the `app_settings` collection was used (keyed
  `contact`/`promotionalBanner` docs) and left empty after testing; test users
  removed. No destinations/trips/batches/bookings/users/reviews/FAQs/blogs/
  wishlists/notifications touched. `logo.jpg` untouched.
- **Regression:** production build passes; `/api/settings` + all existing APIs
  200; admin RBAC 401/403 intact; `npm run dev` (client Vite + server) running
  and serving the changed modules. No payments, no auth/booking changes.

### Phase 28 (admin-managed website logo — end-to-end)
- **Centralized branding settings:** a new `app_settings` collection
  (`server/src/models/AppSetting.js`, one doc per `key`) holds `key:
  'branding'` → `data.logo = { url, publicId, alt, updatedAt }`. Only image
  metadata is stored — never the binary. No existing model was modified and no
  other collection is touched.
- **Public API:** `GET /api/settings/branding` (no auth) →
  `{ success, data: { logo: { url, alt } } }`. With no custom logo (or on any
  failure) it returns the guaranteed default: `{ url: "/logo.jpg", alt:
  "24x7Chhutti" }`.
- **Admin API (RBAC — `requireAuth` + `requireRole` at the parent admin
  router, unweakened):**
  - `GET /api/admin/settings/branding` — admin shape incl. `publicId`,
    `updatedAt`, `isCustom` and `cloudinaryConfigured`.
  - `POST /api/admin/settings/branding/logo` — multipart `image`, restricted to
    JPG/JPEG/PNG/WebP (SVG stays disabled), 5 MB limit, optional `alt`. Uploads
    through the existing Multer → `imageStorage` → Cloudinary pipeline into the
    new canonical `brand-media` folder (`imageFolders.js`), then persists the
    returned metadata.
  - `DELETE /api/admin/settings/branding/logo` — removes the branding setting;
    the site falls back to `/logo.jpg`. Non-destructive (old Cloudinary assets
    and `client/public/logo.jpg` are never deleted).
- **Cloudinary status:** `isCloudinaryConfigured === false`
  (`CLOUDINARY_CLOUD_NAME` empty in `.env`). Real uploads return the existing
  clean **503 "Cloudinary is not configured"** and nothing is persisted — no
  fake uploads, no fabricated publicIds. The admin Settings page shows a clear
  "Cloudinary is not configured" warning and surfaces the 503 message on save
  attempts. **End-to-end upload verification is blocked until real credentials
  are supplied.**
- **Centralized frontend branding:** `lib/branding.js` (brand name + fallback
  constant), `services/settings.js`, `hooks/useBranding.js` (React Query,
  dedicated `['branding']` key, defaults to `/logo.jpg` on any failure) and
  `components/brand/BrandLogoImage.jsx`. `components/brand/Logo.jsx` now
  consumes branding. **No component hardcodes `src="/logo.jpg"` anymore** —
  Header, MobileNav, Footer, AdminSidebar, LoginModal, HeroSection watermark
  and DestinationImage fallback all resolve the single active logo.
- **Admin UI:** `/admin/settings` is now a real `AdminSettingsPage` (was a
  placeholder) with a Branding section: current-logo preview + Default/Custom
  badge, upload control (JPG/JPEG/PNG/WebP, max 5 MB), **local preview before
  save** (object URL, cancel/change supported), Save Logo, and Reset to Default
  (confirm dialog, shown only when a custom logo is active). After save/reset
  the `['branding']` and `['admin','settings','branding']` queries are
  invalidated so public components update immediately. Uploaded Cloudinary URLs
  are unique per upload, so the active logo updates without relying on browser
  cache invalidation.
- **Database safety:** only the `app_settings` collection was used during
  testing and left clean (empty). Test users created for RBAC checks were
  removed. Destinations/trips/batches/bookings/users/reviews/FAQs/blogs/
  wishlists/notifications untouched. `logo.jpg` (root + `client/public/`) both
  byte-identical and untouched.
- **Regression:** production build passes; public branding 200 (default +
  custom + reset); all existing public/admin APIs 200; admin RBAC 401/403
  intact; `/api/account/*` still 401 without auth. No payments, no booking
  logic, no auth changes.

### Phase 27 (custom-trip lead generation — end-to-end)
- **Enquiry system built (was a placeholder):** the Admin → Enquiries area and
  the dashboard `enquiries` metric previously had NO backend (placeholder page,
  count hardcoded 0). Built the planned generic enquiry system per
  `docs/DATABASE.md`/`docs/API.md` — model, validator, service, controller,
  public route, admin route, client service, and a real `AdminEnquiriesPage`.
- **Public lead submission:** `POST /api/enquiries` (public, `optionalAuth`).
  Visitors can submit WITHOUT logging in. Server-side Zod validation (name,
  destinationId must be a real PUBLISHED destination, 10-digit Indian mobile
  `6-9` prefix, email). `source` enum (`website|custom_trip|contact_form|
  trip_page|destination_page`) — the new modal sends `custom_trip`. Optional
  `userId` attribution is stored when a session exists but never exposed
  publicly.
- **Admin:** `GET /api/admin/enquiries` (filters: status/source/search),
  `GET /:id`, `PATCH /:id/status`, `DELETE /:id` — all behind
  `requireAuth` + admin (401/403 verified). Dashboard `enquiries` count is now a
  real DB count. `/admin/enquiries` is a live page (list, inline status update,
  delete with confirm, filters, empty/loading/error states).
- **Plan Your Dream Trip modal (`PlanTripModal`):** Capture A Trip UX pattern,
  own implementation. Dark 70% overlay covering the viewport, body scroll lock,
  compact centered white card (`w-[calc(100vw-2rem)] max-w-[380px]`), close X
  top-right, Escape + overlay-click close (inside-click keeps open), subtle
  fade/scale CSS animation. Fields in a single vertical column: Name →
  Destination → Mobile (+91 prefix) → Email → full-width "Talk to our Experts"
  CTA.
- **Destination selector:** a real dropdown (not free text) fed by the existing
  published destinations API (no hardcoding). Scrollable list, search filter,
  loading / empty / API-error states, click-to-select, keyboard accessible,
  mobile-friendly. Contextual preselection: opening from a destination page
  (`/destination/bali`) pre-selects Bali; trip pages preselect the trip's
  destination; global triggers leave it unselected.
- **Form states:** client-side validation with field-level errors; loading
  ("Submitting...", button disabled, duplicate-click guarded); success state
  ("Thank you!" + received message + Done button that closes); error state
  keeps entered values and shows server/field errors for retry.
- **Triggers:** homepage "Plan Your Dream Trip" CTA section (config-driven via
  `HOMEPAGE_SECTIONS`), a contextual trigger on every destination page price
  card, and a contextual trigger on every trip page sticky card. One reusable
  modal mounted once in `PublicLayout`.
- **Reuse:** existing `destinationApi`, existing design tokens/buttons/inputs,
  existing error middleware, existing `optionalAuth`/RBAC patterns. No new
  dependencies. No payments, no notifications pipeline (enquiry record only —
  reported honestly).
- **Database safety:** only Enquiry records created/deleted during testing; no
  other collections touched. Ladakh batch untouched (DRAFT). One test enquiry
  remains in the DB (`X | t@e.com | custom_trip | Bali | new`) as admin
  verification data — delete via admin if not wanted.
- **Regression:** production build passes; all public APIs 200; admin RBAC
  401/403 intact; all SPA routes 200; changed modules compile via Vite.

### Phase 26 (real-media pipeline prep — no assets/credentials invented)
- **Cloudinary status:** all four `CLOUDINARY_*` / `VITE_CLOUDINARY_CLOUD_NAME`
  vars are STILL EMPTY in `.env`. No cloud name, key, or secret is configured
  anywhere, so `isCloudinaryConfigured` is `false` and uploads keep the clean
  **503 "Cloudinary is not configured"** behavior (verified by direct service
  call). **Cloudinary end-to-end upload testing is blocked because genuine
  Cloudinary credentials have not been supplied.** No credentials were
  fabricated, hardcoded, or claimed to work.
- **Security fix:** the working tree of `.env.example` (a tracked template) had
  two credential-looking `CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` lines
  appended to it. Removed them — `.env.example` is clean vs HEAD again and no
  credential-like values exist in any tracked file. Values were never used by
  the app (the server reads `.env`, which has them empty).
- **Media pipeline audit (Step 1):** reviewed `AdminMediaPage`, `DestinationImage`,
  `TripGallery`, `TravelerGallery`, `ImageUploader`, `imageStorage.service`,
  `cloudinary.service`, `imageFolders`, `upload.routes/controller`, `TripMedia`
  model + routes, `Destination`/`Trip`/`Blog` image schemas, `DestinationImage`
  lazy/eager + srcSet + onError fallback. No working functionality rewritten.
- **Folder alignment (Steps 3/5/6):** added the required logical `destination-media`
  and `blog-media` buckets to `imageFolders.js` so all four canonical buckets exist:
  `trip-media`, `traveler-media`, `destination-media`, `blog-media`. The admin
  forms now upload into the matching bucket: `DestinationForm` →
  `destination-media`, `TripForm` → `trip-media`, `BlogForm` → `blog-media`
  (`AdminMediaPage` already used `traveler-media` — Phase 23 fix preserved).
  Legacy `destinations`/`trips`/`blogs` keys kept for back-compat. Verified via
  the `folderFor` helper (correct `travel-crm/…` paths + entity subfolder).
- **Shared lightbox (Step 9):** extracted the trip gallery's fullscreen lightbox
  into `components/ui/lightbox.jsx` (Esc/arrows, scroll-lock, counter,
  Cloudinary-aware via `resolveImageSrc` with plain-URL fallback) and reused it in
  `TripGallery`. The **destination gallery** previously had no interaction — it
  now uses the same lightbox (tap any image to open fullscreen, next/prev/close).
  Genuine UX parity; no fake gallery records created.
- **Destination media (Step 5):** architecture supports hero + ordered gallery +
  alt + responsive + lazy + fallback. All 11 destinations still have **empty
  galleries** (no fabricated records). `India` keeps its honest logo fallback
  (no invented image).
- **Trip media (Step 6):** architecture supports hero + ordered gallery +
  responsive gallery + hero-only fallback + lazy + alt + broken-image fallback.
  All 7 trips have **empty galleries** (honest). `TripGallery` renders the empty
  placeholder only when no images exist.
- **Blog media (Step 7):** all 3 published blogs have valid covers (verified —
  each returns 200 with `f_auto`-style Picsum URLs + alt text) and **zero broken
  or empty image blocks**. No cover replaced unnecessarily.
- **Traveler media (Step 7/real):** honestly empty — the public
  `/trips/:id/media` endpoint returns `[]`; no traveler UGC fabricated.
- **Image performance (Step 8):** homepage hero remains `eager`; below-the-fold
  images remain `lazy`; `object-cover`, alt text, `onError` fallback, and
  srcSet/Cloudinary transform path all preserved. No layout-breaking changes.
  Trip hero URLs contain literal spaces (Picsum seed) — browsers auto-encode so
  they render (verified 200 after redirects); left untouched per no-data-change rule.
- **Database safety (Step 10):** zero DB writes. No bookings/customers/users/
  reviews/batches/pricing/trip logic touched. No media records deleted or created.
- **Ladakh (Step 11):** batch untouched, remains DRAFT.
- **Regression (Step 12):** production build passes; health 200; all public APIs
  200; batch endpoint 200 with real trip ID; RBAC 401 intact (admin/media/upload/
  dashboard/account); all SPA routes 200; changed modules compile via Vite.
  No payments, no API changes, no DB changes.

### Phase 25 (UX/product audit vs Capture A Trip — reference only)
- **Audited** the whole public site against the Capture A Trip experience (page
  structure, cards, filters, discovery flow, conversion hierarchy) WITHOUT copying
  content/assets. Result: the existing information hierarchy already matches the
  target journey; most differences are intentional or blocked by real-data rules.
- **Header search fixed (dead control):** the desktop header + mobile-nav search
  input submitted but did nothing ("No-op for now"). It now navigates to
  `/trips?search=…` exactly like the hero search (`HeaderSearch.jsx`), so header
  search is a real discovery entry point. Optional `onSearch` prop preserved.
- **Login modal legal links fixed:** Terms & Conditions / Privacy Policy used
  `href="#"` (dead). They now route to the real `/terms-and-conditions` and
  `/privacy-policy` pages and close the modal on click (`LoginModal.jsx`).
- **Trip detail sticky price consistency:** the sticky booking card showed
  `Trip.startingPrice` even when real upcoming departures are cheaper (e.g. Bali
  card showed ₹56,999 while its only departure is ₹51,999). The card now derives
  the display price from the **cheapest real upcoming public batch** (with honest
  strikethrough original + discount), falling back to `startingPrice` only when no
  departure is scheduled. Same data source as the discovery cards; never fabricated.
- **Homepage trip card parity:** `HomepageTripCard` now also renders the real
  scarcity/availability badge (Sold out / Only X seats left) and the real
  rating summary — matching the `/trips` listing card. Real batch data only.
- **Contact page honesty:** removed the fabricated `support@24x7chhutti.com` +
  "(replies within 24 hours)" claim (no email infra exists). Now honestly says
  "Email support coming soon" + "use the form below", matching the footer.
- **Promo banner dismiss button** was `absolute` with no `relative` parent, so the
  X positioned against the viewport. Wrapper is now `relative`.
- **NOT NEEDED / intentionally not cloned:** nav items that map to `/trips`
  (Group Trips / Travel Styles / Upcoming Group Trips / Deals all route to the
  real discovery page); "Free Goodies"-style marketing badges; community-size /
  traveller-count stats (honest "coming soon"); phone number in header (no real
  number exists); TikTok-style UGC / video sections (honest placeholders kept).
- **Regression:** production build passes; all public APIs 200; RBAC 401 intact;
  all SPA routes 200; no console/runtime errors in changed modules; responsive
  classes untouched. No payments, no Cloudinary, no data changes, no API changes.

### Phase 24 (UX polish, no payments)
- **Trip detail — conversion hierarchy (Step 3):** the sticky booking card now shows
  the real **next departure** (date + seats) and a **"Book this departure"** CTA linking
  straight into the booking wizard with the correct batch. Departures are fetched ONCE
  at the TripPage level and shared with the departures section (`TripDepartures` accepts
  optional shared props — no duplicate requests). Sold-out next batches show an honest
  "Sold out" note; trips with no departures show an honest empty message. No fake
  payment CTA was added — payments remain intentionally disabled.
- **Destination detail (Step 2):** new **"Similar destinations"** section — real
  published destinations in the same market category (excludes self, hidden when fewer
  than 2 peers). Reuses existing cards/APIs.
- **Search & discovery (Step 11):** when a `/trips` search returns zero trips, the page
  now surfaces **destinations matching the term** (e.g. searching "Goa" shows the Goa
  destination even though Goa has no packaged trip). Client-side filter over the real
  destinations API — no new infrastructure. Hidden when nothing matches.
- **Audit results:** homepage section order already matches the target journey; all
  sections are data-driven; Community stats / UGC / videos keep honest "coming soon"
  states; blog image blocks are clean; FAQ query-key fix (Phase 21) intact; bookings
  honestly state "online payments coming soon — no payment collected".
- **Regression:** 15/15 backend checks pass; production build passes; all 28 public/
  account/admin SPA routes return 200. No payment logic, no booking logic, no data
  deleted — all preserved.

### Phase 23 (media layer)
- **Cloudinary status:** all four `CLOUDINARY_*` / `VITE_CLOUDINARY_CLOUD_NAME` vars are
  STILL empty in `.env` (verified again this phase; not fabricated). The full code path
  is intact — admin upload → multer (5 MB, image/*) → `imageStorage` →
  `cloudinary.service` → `isCloudinaryConfigured` guard — and returns a clean 503
  ("Cloudinary is not configured") when unconfigured. RBAC intact (anon 401). **Uploads
  were NOT claimed as tested — end-to-end Cloudinary upload verification is blocked
  until real credentials are supplied.**
- **Media audit:** `TripMedia` model/service/routes, `ImageUploader`, `DestinationImage`,
  `TripGallery`, `TravelerGallery`, admin Media page and folder abstraction all verified
  correct and working with URL fallback. No media architecture rebuilt.
- **Folder abstraction:** added logical `trip-media` and `traveler-media` buckets to
  `imageFolders.js`; fixed the admin Media page which was uploading to the wrong
  `travel-crm/sightseeing` folder → now `traveler-media` (`AdminMediaPage.jsx`).
- **Hero resolution:** homepage hero / trip / destination heroes were rendering a
  600px source upscaled to full width (blurry). Upgraded all 10 published-with-image
  destination heroes and all 7 trip heroes to a **higher-resolution variant of the SAME
  Picsum seed** (1600×900) — same asset, sharper at hero widths. `India` untouched (no
  image). Reversible targeted `$set`.
- **LCP loading:** `DestinationImage` gained a `loading` prop (default `lazy`); the
  homepage hero now loads `eager` for LCP (`HeroSection.jsx`).
- **Fake traveler media removed from public view:** the sole TripMedia record was a
  fabricated "test1" asset (fake Cloudinary publicId + placeholder image). It is now
  `published: false` with the bogus `publicId` cleared (record preserved, reversible),
  so the public Traveler Gallery shows its honest empty state. No traveler media was
  manufactured.
- **Regression:** 16/16 backend checks pass (counts, hero resolutions, covers, batch
  visibility, RBAC, admin media list). Production build passes; all SPA routes 200.
  Bookings/batches/users/wishlists/notifications/FAQs/reviews/blogs/destinations/trips
  all preserved.

### Phase 22 (content completion)
- **Destinations (11/11)** now carry original 24x7Chhutti editorial content: meaningful
  short descriptions, multi-paragraph long descriptions with highlights, and proper
  `type` values (beach/hill-station/adventure/cultural). SEO title/description/keywords
  set for all. `India` gained a region + content (hero image intentionally left empty —
  no asset exists; logo fallback shows).
- **Trips (7/7)** — the priority: every published trip now has a real description,
  a full day-by-day itinerary matching its duration (5–8 days), realistic
  inclusions/exclusions, important-travel-information (visa, altitude, weather,
  fitness, cancellation) and SEO fields. Nothing invents specific hotels, flights or
  operators; generic product copy only.
- **Blogs (3/3)** rewritten as readable articles (headings/paragraphs/lists/quotes) and
  given covers by reusing each linked destination's existing in-DB hero image (our own
  asset). Empty image content-block removed from the Vietnam post. `readingTime`
  recomputed server-style.
- **Trip/destination detail pages** render multi-paragraph descriptions correctly
  (`whitespace-pre-line`) — DestinationPage + TripPage. No other UI changes.
- **Cloudinary (Step 6):** full code path verified — admin upload → multer →
  `imageStorage` → `cloudinary.service` → `isCloudinaryConfigured` guard. All four
  `CLOUDINARY_*`/`VITE_CLOUDINARY_CLOUD_NAME` vars are EMPTY in `.env`, so uploads
  return a clean 503 ("Cloudinary is not configured") and existing URL fallback keeps
  working. No credentials were fabricated; real uploads require real credentials.
- **Ladakh batch (Step 8):** left DRAFT. BAT-000010 (dep 2027-06-12) is unpublished,
  has 0 bookings, is priced (26,999) ABOVE the trip starting price (25,999), and its
  return date spans 7 nights vs the trip's 6 — inconsistent and not clearly intended
  for public booking. Publishing requires admin to reconcile price + duration and set
  status/published. No departure dates were fabricated.
- **Homepage** now uses real data in every section (hero = featured Bali, explorer
  tabs, 7 upcoming trips with itineraries, trending, 1 real review, 4 FAQs, 3 blogs
  with covers). Community stats / UGC / video sections keep honest "coming soon" states.
- **Regression:** health 200, all list/detail APIs return the new content, draft
  batches still hidden publicly, RBAC 401/403 intact, admin CRUD intact, production
  build passes. Existing bookings/batches/users/wishlists/notifications untouched.

### Phase 21 (audit + completion)
- **Audited** the complete frontend→API→service→MongoDB flow. No frontend empty-state
  bug was found: every section that renders "No … yet" does so only when data truly
  does not exist. All 11 published destinations, 7 published trips, upcoming
  departures, blogs, FAQs and reviews render from real DB data.
- **Fixed** a genuine React Query cache-key collision: `HomepageFaqSection` and
  `FaqsPage` both used `['faqs','global']` with different `limit` params, so the
  second mount could silently reuse stale cache. Keys now include the limit
  (`client/src/components/home/HomepageFaqSection.jsx`, `client/src/pages/FaqsPage.jsx`).
- **Trip cards now show real ratings** where approved reviews exist: `TripCard` and
  the homepage `HomepageTripCard` render `StarRating` + average + count from the
  server-computed `ratingSummary` (real approved reviews only, never fabricated).
- **Data corrections (equivalent to admin CMS edits, non-destructive `$set` only):**
  - `India` destination had a **missing `category`** field (not `other`), so it never
    matched any category tab despite being published. Set to `domestic` (4 domestic now).
  - Marked `featured: true` on Bali, Vietnam, Ladakh and Kerala (all real, published,
    with real images + trips) so the homepage hero shows real destination imagery
    instead of only the logo watermark.
- Verified: destinations (11, incl. category tabs 5/4/2), trips (7, featured 1),
  per-trip departures (incl. sold-out `full` batches), blogs (3 published), FAQs
  (4 global), reviews (1 approved), auth/RBAC (anon 401, non-admin 403, admin OK),
  admin CRUD for destinations/trips/batches/blogs/FAQs/reviews, production build OK.
- **Known data gaps (report only, no fabrication):** blog cover images are empty on all
  3 published blogs; trip `description`/`itinerary` are empty on all trips; Ladakh
  Expedition has only a draft batch (no public departure); `CLOUDINARY_*` env vars are
  empty in `.env` so admin image uploads currently return 503 until configured.

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
- Payments/refunds (Razorpay) — later phase (booking model is payment-ready)
- Enquiry notification pipeline (no email/SMS sending; enquiry records are
  created and surfaced in Admin → Enquiries only)
- Blog media CMS (Cloudinary uploads), video embeds, blog comments; gallery
  management; wishlist/notifications; change-phone flow

## Verification results (all actually performed)

### Phase 29 — header + promotional banner
- **Build:** `npm run build --workspace client` succeeds (index 70.50 kB, no
  warnings/errors).
- **Public settings:** `GET /api/settings` → 200 with default
  `{ logo, contact:{phone:"",showPhoneInHeader:false}, promotionalBanner
  {enabled, "Early Bird Sale — Save on upcoming group trips", "Explore trips",
  "/trips", shimmer:true} }`. `GET /api/settings/branding` (back-compat) → 200.
- **Admin RBAC:** unauth `GET /api/admin/settings`, `PATCH
  /api/admin/settings/contact`, `PATCH /api/admin/settings/promotional-banner`
  → 401; authenticated non-admin → 403 (all); admin → 200. Branding logo
  endpoints unchanged (admin reset 200; upload 503 while Cloudinary
  unconfigured — honest, nothing persisted).
- **Admin mutations:** `PATCH contact {phone, showPhoneInHeader:true}` →
  public reflects the number; `PATCH promotional-banner` (message/CTA/URL/
  shimmer/color) → public reflects; banner `enabled:false` → public
  `enabled:false`.
- **Validation:** `ctaUrl:"javascript:alert(1)"` → 400 "Unsafe URL scheme";
  `backgroundColor:"red; background:url(x)"` → 400 "Use a hex color".
- **DB state after tests:** `appsettings` collection empty; test user removed;
  no other collections touched. `client/public/logo.jpg` checksum unchanged.
- **Search audit:** "Early Bird Sale"/"Explore trips" remain only as intentional
  default fallbacks (`lib/settings.js`, `settings.service.js`); "/logo.jpg" only
  in the centralized branding fallback; "Login / Sign Up" gone; no hardcoded
  phone numbers; no `logo.png/svg`/`src="/logo` in client source.
- **Dev servers:** `npm run dev` verified — Vite (:5173) serves the new
  Header/PromoBanner/AdminSettingsPage/usePublicSettings modules (200), backend
  (:5000, `node --watch`) serves `/api/settings` and `/api/admin/settings`
  (401 unauth).

### Phase 28 — admin-managed branding
- **Build:** `npm run build --workspace client` succeeds (index 66.96 kB, no
  warnings/errors).
- **Service:** no branding setting → public `{logo:{url:"/logo.jpg",alt:
  "24x7Chhutti"}}`; `setBrandingLogo` persists and public API returns the custom
  URL; `clearBrandingLogo` restores the default. SVG mimetype blocked, JPEG
  allowed (direct service assertions).
- **Public API:** `GET /api/settings/branding` → 200 default; after persisting a
  custom logo → 200 with custom URL; after DELETE reset → 200 default again.
- **Admin RBAC:** unauth GET/POST/DELETE `/api/admin/settings/branding*` → 401;
  authenticated non-admin → 403 (all three verbs); admin → 200. Existing admin
  routes (dashboard/destinations/trips/faqs/enquiries/upload) still 200 for
  admin, account profile 401 without auth.
- **Upload validation:** valid PNG upload → **503** "Cloudinary is not
  configured" (nothing persisted, clean error); text file → 400 "Only image
  files are allowed"; SVG → 400 "Only JPG, JPEG, PNG or WebP images are
  supported"; no file → 400; >5 MB → 413.
- **DB state after tests:** `appsettings` collection empty; test user removed;
  no other collections touched.
- **Search audit:** `logo.jpg` remains only as the centralized fallback
  (`lib/branding.js`), the `client/public/logo.jpg` asset, and doc text. No
  `logo.png`/`logo.svg`/`src="/logo`/`background-image` in client source. All
  logo UI goes through `BrandLogoImage`/`useBranding`.
- **Cloudinary:** real upload blocked (no credentials). Documented honestly.

### Phase 27 — custom-trip enquiry
- **Build:** `npm run build --workspace client` succeeds (index 66 kB, no
  warnings/errors).
- **Backend health:** `GET /api/health` → 200.
- **Public enquiry:** `POST /api/enquiries` — valid submission creates a record
  (source `custom_trip`, destination snapshot "Bali", status `new`); logged-in
  submissions store `userId` (admin-only). Validations verified: blank name →
  "Name is required"; missing destination → "Please select a destination";
  invalid phone → "Please enter a valid mobile number"; invalid email →
  "Please enter a valid email address"; unknown/unpublished destination → 400;
  unexpected `source` → 400.
- **Admin (RBAC):** unauth `/api/admin/enquiries*` → 401; non-admin → 403;
  admin list/detail/status/delete work; dashboard `enquiries` metric = real
  count.
- **Destinations used by the modal:** existing `GET /api/destinations?limit=50`
  returns 11 published destinations (no new API).
- **Routes:** `/`, `/trips`, `/trip/:slug`, `/destinations`, `/destination/:slug`,
  `/admin/enquiries`, `/booking/*` all 200; changed modules compile via Vite.
- **Cleanup:** duplicate test enquiries removed; one representative test
  enquiry left for admin verification (see Phase 27 notes).

### Phase 26 — media preparation
- **Build:** `npm run build --workspace client` succeeds (54.16 kB index; no
  warnings/errors).
- **Cloudinary:** `isCloudinaryConfigured === false`; direct
  `uploadBuffer(Buffer, {folder})` throws clean **503 "Cloudinary is not
  configured"**. All four vars empty in `.env`; `.env.example` clean (no
  credential-like values; `git grep` confirms none in tracked files).
- **Folders:** `folderFor('trip-media'|'traveler-media'|'destination-media'|
  'blog-media')` → correct `travel-crm/<bucket>[/id]` paths (verified via node).
- **Changed modules compile:** `/src/components/ui/lightbox.jsx`,
  `/src/components/trips/TripGallery.jsx`, `/src/pages/DestinationPage.jsx`,
  `/src/components/admin/{TripForm,DestinationForm,BlogForm}.jsx` all 200 on Vite.
- **Backend health:** `GET /api/health` → 200.
- **Public APIs:** destinations, trips (+includeBatches), blogs, faqs,
  reviews/recent, destination detail, trip detail, `trips/:id/batches` (real ID),
  `trips/:id/media` (empty) all 200.
- **Routes:** `/`, `/trips`, `/trip/:slug`, `/destinations`, `/destination/:slug`,
  `/blogs`, `/blog/:slug`, `/faqs`, `/about`, `/contact`, `/account*`, `/admin*`,
  `/booking/*`, legal pages — all 200.
- **RBAC:** unauth `/api/admin/*` (destinations, media, upload, dashboard) → 401;
  `/api/account/*` → 401.
- **Images:** Picsum heroes/covers/batch assets all return 200 after redirects
  (URL-encoded where needed); no 404/broken image requests found.
- **DB:** zero writes; Ladakh batch untouched (DRAFT).

### Phase 25 — audit fixes
- **Build:** `npm run build --workspace client` succeeds (54.12 kB index, vendor
  chunks unchanged, no warnings/errors).
- **Frontend module compile:** `/src/components/layout/HeaderSearch.jsx`,
  `/src/components/auth/LoginModal.jsx`, `/src/components/home/UpcomingTripsSection.jsx`,
  `/src/pages/TripPage.jsx` all served 200 by the Vite dev server (HMR clean).
- **Backend health:** `GET /api/health` → 200 `{"success":true}`.
- **Public APIs:** destinations, trips, blogs, faqs, reviews/recent, destination
  detail, trip detail all 200; trips search (`?search=vietnam`), featured filter,
  and budget filter return real data.
- **Routes:** `/`, `/trips`, `/trip/:slug`, `/destinations`, `/destination/:slug`,
  `/blogs`, `/blog/:slug`, `/faqs`, `/about`, `/contact`, `/account`, `/admin`,
  `/booking/:param` all return 200 on the SPA.
- **RBAC:** unauthenticated `/api/admin/*` → 401, `/api/account/*` → 401.
- **No data/API changes:** zero database writes, zero backend code changes in
  this phase.

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
  backend purge at suite start. No destructive seed run in Phase 20. In
  Phase 21 India's `category` was corrected to `domestic` and Bali/Vietnam/
  Ladakh/Kerala were marked `featured` (admin-editable via CMS).
- Client bundle >500 kB fixed: Phase 20 lazy + manualChunks removes warning; remaining largest chunk is `vendor-QaJ2r_E4.js 151 kB` (react).
- Phase 25 contact page no longer shows an email address (honest "coming soon"
  state); no real support email/phone exists yet.

## Recommended next milestone
**Phase 30 — Real Cloudinary media + photography:** the project owner must supply
real Cloudinary credentials (cloud name + API key + secret in `.env`; public cloud
name in `VITE_CLOUDINARY_CLOUD_NAME`) and legally usable/owner-supplied destination
and trip photography. Once present: end-to-end upload test via the admin forms
(which already target the correct `trip-media`/`traveler-media`/`destination-media`/
`blog-media` folders), replace the Picsum placeholder heroes with real imagery
through the existing admin CMS, populate destination/trip galleries (lightbox-ready),
and set real blog covers. **Real photography cannot be added until legally
usable/owner-supplied assets are provided.** Payments (Razorpay) are a separate
later phase — the booking model is already payment-ready (`paymentStatus`).
After media: enquiry notifications (email/SMS to the travel team), then payments.

## How to use this file
- Read it before starting work.
- Keep it accurate: mark only what is truly implemented and verified.
- Update it at the end of each meaningful milestone.
- Do not mark unfinished work as completed.
