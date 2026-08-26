# FRONTEND

Frontend conventions and architecture for **24x7Chhutti**.

Stack: **React + Vite (JavaScript)**, **React Router**, **TanStack Query**,
**Zustand**, **React Hook Form**, **Zod**, **Axios**, **shadcn/ui**,
**Tailwind CSS**, **Lucide React**, **Sonner**, **date-fns**. Recharts and
TanStack Table are added only when actually required.

## Structure

```
client/src/
├── components/
│   ├── ui/            # shadcn/ui primitives (button, input, label, checkbox,
│   │                  # dialog, sheet, container, card, textarea, select, badge)
│   ├── layout/        # public shell: PublicLayout, Header, SiteNav,
│   │                  # HeaderSearch, HeaderAuth, MobileNav, Footer
│   ├── auth/          # LoginModal (existing authentication modal)
│   ├── brand/         # Logo
│   ├── admin/         # AdminLayout, AdminSidebar, AdminHeader, RequireAdmin,
│   │                  # DestinationForm, TripForm
│   ├── destinations/  # DestinationCard, DestinationImage
│   ├── trips/         # TripCard, ListItemEditor, FaqListEditor,
│   │                  # TripItineraryDay, TripItineraryBuilder, TripDepartures,
│   │                  # TripDestinationTabs, TripFilterPanel
│   ├── home/          # homepage sections: PromoBanner, HeroSection,
│   │                  # CommunityStats, DestinationExplorer, UpcomingTripsSection,
│   │                  # BookWithConfidence, WhyChooseUs, TrendingDestinations,
│   │                  # ReviewsSection, HomepageFaqSection, CommunityMoments,
│   │                  # RelatedBlogs, RealityTripsSection
│   ├── booking/       # (future)
│   └── admin pages    # pages/admin/* (dashboard, destinations, trips, placeholders)
├── pages/             # route-level pages (home, destinations, destination detail,
│                      # trips, trip detail)
├── routes/            # React Router configuration (PublicLayout + AdminLayout)
├── hooks/             # custom hooks (incl. useAuth, TanStack Query hooks)
├── services/          # centralized API calls (axios)
├── stores/            # Zustand stores (auth session, ui overlay state)
├── schemas/           # Zod schemas for forms
└── lib/               # utilities (cn, queryClient, nav config)
```

Path alias `@/` maps to `client/src/`.

## Conventions

- **React Router** for navigation; route config in `client/src/routes/`.
- **Centralized API communication.** All HTTP calls go through
  `client/src/services/` using a shared axios `httpClient` instance. Do not
  scatter `fetch`/axios calls throughout components. Per-domain service modules
  expose typed functions that pages/hooks consume.
- **TanStack Query** for server state: fetching, caching, invalidating,
  mutations. Query keys are defined consistently.
- **Zustand** for genuine client state (e.g. auth session, UI state). Avoid
  putting server data in stores — that is TanStack Query's job.
- **React Hook Form + Zod** for forms. Zod schemas live in `client/src/schemas/`
  (and may be shared via `shared/` for parity with server validation).
- **shadcn/ui** primitives for consistent UI. Build on Tailwind.
- **Lucide React** for icons; **Sonner** for toasts; **date-fns** for dates.
- **Reusable components.** Prefer composition over duplication.
- Functional components + hooks only (no class components).
- **Responsive design** from the start (mobile-first with Tailwind breakpoints).
- **Accessibility** from the start: semantic HTML, labels, keyboard nav, focus
  states, ARIA where needed.
- **Loading / error / empty states** handled consistently across data-driven
  views (skeletons, error banners, empty placeholders).
- Keep business logic out of components; delegate to services/hooks.

## State management summary

| Concern            | Tool           |
| ------------------ | -------------- |
| Server data        | TanStack Query |
| Client UI/session  | Zustand (`stores/auth.js`, `stores/ui.js`) |
| Forms              | React Hook Form + Zod |
| API transport      | Axios (centralized services) |
| Navigation         | React Router (`routes/`, `lib/nav.js`) |
| Notifications      | Sonner         |

## Public shell conventions
- The whole public site is wrapped in `PublicLayout` (header + main + footer),
  with routes defined in `routes/index.jsx`.
- Navigation comes from `lib/nav.js` (single source for header/mobile/footer).
- The existing `LoginModal` is opened via `stores/ui.js` (`openAuthModal`);
  never create a second auth modal or duplicate auth logic.
- Use `useAuth()` for auth state (`isAuthenticated`, `user`, `isLoading`,
  `logout`).

## Admin conventions
- Admin routes live under `/admin` and are wrapped in `RequireAdmin` +
  `AdminLayout`. `RequireAdmin` is UX-only; backend enforces roles.
- Admin sidebar navigation is driven by `lib/adminNav.js` (single source).
- Admin API calls go through `services/admin.js`.
- Unbuilt admin sections use `AdminPlaceholderPage` (clearly marked).
- Only users with role `admin` may access the admin area.

## Homepage conventions
- The homepage (`pages/HomePage.jsx`) composes sections from
  `lib/homeContent.js` (`HOMEPAGE_SECTIONS` order/visibility) so a future CMS
  can control them.
- All homepage data comes from the real `destinationApi` / `tripApi` — never
  hardcode business content or fake statistics. Sections without real data
  (reviews, blogs, community moments, videos) render clean "coming soon"
  placeholders.
- Reusable carousels use `components/ui/horizontal-carousel.jsx` (CSS scroll
  snapping + native horizontal scroll + prev/next buttons). It uses
  `shrink-0` on items so cards overflow and scroll.
- Configurable content (promo banner, confidence benefits, USPs, FAQs, section
  order) lives in `lib/homeContent.js`.

## Destination conventions
- Public queries use `services/destinations.js` (`destinationApi`); admin uses
  `adminDestinationApi` in the same module.
- Query keys: `['destinations', {page, limit, ...}]`, `['destinations','slug',slug]`,
  `['admin','destinations', ...]`. Mutations invalidate `['admin','destinations']`.
- Reuse `DestinationCard`, `DestinationImage`, and the shared
  `DestinationForm` (create/edit) — never duplicate the form.
- SEO: use `useSeo` from `lib/seo.js` on public pages (title/meta/canonical).

## Trip conventions
- Public queries use `services/trips.js` (`tripApi`); admin uses `adminTripApi`.
- Query keys: `['trips', {page, limit, ...}]`, `['trips','slug',slug]`,
  `['admin','trips', ...]`. Mutations invalidate `['admin','trips']`.
- Reuse `TripCard` and the shared `TripForm` (create/edit). Trip content editors
  are composed from `ListItemEditor`, `FaqListEditor`, `TripItineraryBuilder`,
  `TripItineraryDay` — never duplicate them.
- `DestinationImage` is the generic image-with-fallback (reused by trips too).
- The Destination detail page fetches real trips via `tripApi.list({ destination: slug })`.
- SEO: use `useSeo` + `tripSeoTitle`.

## Trip discovery conventions (/trips)
- **URL is the single source of truth.** Every filter (`search`, `destination`,
  `tripType`, `category`, `minPrice`, `maxPrice`, `departureDate`,
  `departureFrom`, `departureTo`, `featured`), plus `sort` and `page`, lives in
  the query string via `useSearchParams`. Never keep filter state only in
  React state.
- Any filter change resets `page`; changing `page` preserves filters/sort.
- The search input is debounced (~350 ms) and stays synced with the URL so
  back/forward and shared links restore it exactly.
- Reuse `TripDestinationTabs` (destination pills) and `TripFilterPanel`
  (grouped filters) — the same panel instance renders in the desktop sidebar
  and inside the mobile `Sheet` drawer; pass distinct `idPrefix` values so
  label/htmlFor pairs stay unique.
- Active filters render as removable chips; removing a chip updates URL, API
  query and results. "Clear all" resets every filter (sort included).
- Query key: `['trips', queryParams]` (the full param object) so each
  filter combination caches separately; use `placeholderData` to keep the old
  grid visible while new results load.
- Cards always render real data: embedded `trip.batches[]` first, then
  `trip.pricingSummary`, then the `startingPrice` fallback. Discounts show only
  when `originalPrice > price`. No batches → "Departure dates coming soon".
- SEO: `/trips` sets title/description and a canonical that ALWAYS points at
  the unfiltered `${origin}/trips` regardless of active filters (ADR-015).

## Blogs conventions
- Public pages: `/blogs` + `/blogs/:destinationSlug` share `BlogsListing`
  (hero, debounced URL-state search, category pills, cards grid, pagination);
  `/blog/:slug` is `BlogDetailPage` with `BlogContentView` rendering the
  structured content blocks (paragraph links support `[text](url)`).
- Cards: reusable `components/blogs/BlogCard.jsx`. Services:
  `services/blogs.js`; query keys `['blogs', …]`.
- Homepage "Travel Blogs" section replaces the old placeholder and renders real
  published articles (graceful empty state when none exist).
- Admin: shared `components/admin/BlogForm.jsx` (RHF+Zod) with a lightweight
  **structured block editor** (heading/paragraph/list/image-url/quote;
  add/remove/reorder) — no rich-text dependency (ADR-020).

### FAQs conventions — IMPLEMENTED
- `services/faqs.js`: `faqApi` (public) + `adminFaqApi` (admin)
- Global homepage FAQs via `useQuery(['faqs','global'])` → `Accordion`.
- Destination page fetches `/destinations/:slug/faqs`; trip page fetches
  `/trips/:slug/faqs` (priority merge already done server-side) → single
  `Accordion`. Empty states show nothing (clean).
- Admin: `components/admin/FaqForm.jsx` (RHF+Zod) with scope-aware selects.

## Wishlist
- `WishlistButton` heart, `wishlistApi` + `['wishlist']` query, guest → LoginModal, `/account/wishlist`.

## Reviews conventions
- Reusable stars: `components/reviews/StarRating.jsx`
  (`StarRating` display / `StarRatingInput` form).
- Trip page embeds `components/trips/TripReviews.jsx`: summary + distribution +
  verified review cards + Write a Review dialog. Guests clicking the CTA get the
  existing LoginModal; logged-in users get eligibility-aware states (form,
  already-reviewed badge, or a clear ineligible explanation).
- Query keys: `['reviews', tripId, page]`, `['reviews','eligibility',tripId]`,
  `['account','reviews']`. Submitting invalidates reviews + account lists.
- Never render unapproved reviews or fabricate ratings — empty trips show
  "No ratings yet" and "No reviews yet" states.

### Phase 18 — Capture A Trip UX gaps fixed
- Navigation (`client/src/lib/nav.js`) now maps every header item to a real route (no dead placeholder links)
- Homepage `ReviewsSection` renders real approved reviews from `/api/reviews/recent` (loading/empty/error states)
- `DestinationsPage` category tabs (All/International/Domestic/Weekend) — API already supported `category`
- `TripPage` `RelatedTrips` section reuses `TripCard` + existing `tripApi.list({destination})`
- `HeroSection` real Cloudinary hero image via existing `DestinationImage`, gradient overlay, logo fallback
- New `FaqsPage` reuses `faqApi.list` + `Accordion`

### Phase 19 — Content pages + final UX gaps
- New pages: `AboutPage.jsx` (hero, who we are, why choose us, CTA, breadcrumbs, SEO), `ContactPage.jsx` (info + RHF+Zod form with Sonner success, breadcrumbs, SEO), `PrivacyPolicyPage.jsx`/`TermsPage.jsx`/`CancellationPolicyPage.jsx` (readable, breadcrumbs, SEO, footer-linked), `NotFoundPage.jsx` (404 with `noindex`, branded CTAs)
- Routes: `/about`, `/contact`, `/privacy-policy`, `/terms-and-conditions` (alias `/terms` retained), `/cancellation-policy`, `*` → `NotFoundPage`; all under `PublicLayout` in `routes/index.jsx`
- `BlogsPage.jsx` (`BlogsListing`): added `tag` query param support — `useSearchParams` for `search`/`category`/`tag`/`page`, debounced search, tag input + active chips, `Clear all`, `setPage` preserves filters; queryKey includes `tag`; API calls pass `tag` to `blogApi.list`/`listByDestination`; empty state handles `search||category||tag`; pagination via `setPage` (not `setParams` reset) so filters persist; `BlogDetailPage.jsx` tags link to `?tag=` and category to `?category=`
- Navigation/footer (`lib/nav.js`): `FOOTER_NAV.legal` corrected to `/terms-and-conditions` + added `/cancellation-policy`; `FOOTER_NAV.destinations/support` expanded to include Blogs/Destinations for discoverability; header `More` already exposed About/Contact/Blogs/FAQs
- SEO: `useSeo` on all new pages (title/description/canonical); 404 uses `noindex: true`; blogs canonical stays unfiltered to avoid duplicate indexable filter combos

### Phase 20 — Production readiness
- **Performance**: `routes/index.jsx:1` now lazy-loads 29 pages via `React.lazy` + `Suspense` fallback spinner; `vite.config.js:19` adds `manualChunks` (vendor, vendor-router/query/forms/axios/zustand/icons/ui) so initial JS is ~54 kB + shared vendors, not 862 kB monolith.
- **SEO**: `lib/seo.js:1` adds `og:url` + `twitter:card/title/description/image`; `client/public/robots.txt` + `client/public/sitemap.xml` (static public URLs only, no /admin/account/booking, filtered query URLs canonicalize to unfiltered root).
- **Error/loading**: every new Phase 19 page has breadcrumbs, skeletons/empty/error states consistent with existing pages; `RouteFallback` spinner for lazy loading.
- **Image/perf**: `DestinationImage` lazy + `f_auto/q_auto` + `srcSet` retained; no duplicate fetches; Cloudinary `publicId` paths only.

## Notifications
- `NotificationBell` in Header (authenticated only) + MobileNav drawer; unread badge, dropdown, Escape/outside close, mark-read on click, View all → /account/notifications.
- `notificationApi` in services/account.js; query keys `['notifications', …]`.

## Account conventions (/account)
- Layout page guards auth (login panel + existing LoginModal) and renders the
  section nav: Profile (/account), My Bookings, Travellers. The whole area uses
  `useSeo({ noindex: true })`.
- Services in `services/account.js`; query keys `['account','profile']`,
  `['account','bookings', …]`, `['account','travellers']`.
- Profile form updates ONLY name+email; mobile shows read-only with a Verified
  badge (ADR-018). After save, `setAuthenticated()` refreshes header state.
- Bookings list supports status filter pills + pagination (server-side);
  detail pages reuse the price-snapshot presentation and cancel through the
  Phase 9 API with a confirmation dialog.
- Saved travellers are optional quick-fill in the booking wizard ("Use saved"
  select per traveller slot) — values COPIED into the booking; manual entry
  remains fully supported.

## Booking conventions
- The wizard's route is `/booking/:param`: values starting with `BK-` render the
  private confirmation page, anything else is the trip slug for the wizard.
  Departure selection travels in the query string (`?batch=<id>`), so login
  interruptions and refreshes never lose the selection.
- Booking requires auth: render a "Login to continue" panel and call
  `openAuthModal()`; when `useAuth().isAuthenticated` flips true the same page
  continues — never build a second login flow.
- Server state via `services/bookings.js`; query keys `['bookings', …]`,
  `['admin','bookings', …]`. Mutations invalidate bookings + batches + dashboard.
- Client totals are ESTIMATES (labelled); only server-returned snapshots are
  authoritative. Never fake payment success — show "Payment pending".
- Booking/confirmation pages use `useSeo({ noindex: true })`.
- Submission buttons disable while pending; the wizard sends one
  idempotencyKey per flow.

## Trip batch conventions
- Public queries use `services/tripBatches.js` (`tripBatchApi.listByTrip`);
  admin uses `adminTripBatchApi` in the same module.
- Query keys: `['trip-batches', tripId]`, `['admin','trip-batches', {...}]`,
  `['admin','trip-batches', id]`. Mutations invalidate `['admin','trip-batches']`
  plus `['trips']`, `['home']` and `['admin','dashboard']` (homepage cards and
  dashboard counts embed batch data).
- Reuse the shared `TripBatchForm` (create/edit) — never duplicate it. Batch
  code is server-generated and shown read-only in edit mode.
- Date-only rule: never convert ISO date strings through `new Date()` for
  display; use `lib/dates.js` helpers (`formatDateShort/Long`,
  `nightsBetween`) which operate on the `YYYY-MM-DD` portion so calendar dates
  cannot shift with timezones (ADR-014).
- Pricing hierarchy on cards/departures: batch `price` (bold) → struck-through
  `originalPrice` → `discountAmount` ("₹X Off") — only when a discount really
  exists (`originalPrice > price`). `Trip.startingPrice` is only the fallback
  "from" price when no batches exist.
- Departure-specific UI lives in `components/trips/TripDepartures.jsx`; the
  Book Now button must never create a booking — it shows a "coming soon" toast
  until the booking milestone.
- Homepage trip cards read embedded `trip.batches[]` (cheapest upcoming batch
  drives pricing; up to 5 dates rendered as chips). No batches → "Departure
  dates coming soon" fallback. Never fabricate dates or prices.
