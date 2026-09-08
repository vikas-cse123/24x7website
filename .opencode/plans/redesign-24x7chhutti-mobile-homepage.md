# Plan: Redesign 24x7Chhutti Mobile Homepage to Match Capture A Trip Reference

## Context
The current 24x7Chhutti mobile homepage (13 screenshots) feels like a desktop layout compressed into a narrow viewport: oversized headings/cards, excessive vertical padding, desktop grids squeezed, and carousels not peeking. The 13 reference screenshots (Capture A Trip) show a dense, professionally spaced mobile travel platform with compact stats, smaller circular destinations, 1.1-card carousels, sticky bottom nav, and accordion footer. This is a **mobile-first UI refinement**, not a rewrite — keep 24x7Chhutti branding, database, APIs, S3, and all business logic. Use reference only for layout/spacing/density inspiration.

---

## Current State Analysis

**Homepage tree** (`client/src/pages/HomePage.jsx:22-41` + `client/src/lib/homeContent.js:149-195`):
`hero → communityStats → destinationExplorer → soloBanner → upcomingTrips → promoBannerCarousel → bookWithConfidence → vibeWithUs → whyChooseUs → trendingDestinations → reviewsFromTravellers → faq → lovedByTravellers → reviews → communityMoments → relatedBlogs → adventureBanner → realityTrips` (many hidden via `visibility`). Each section is a standalone component in `client/src/components/home/` (20 files). Header is `client/src/components/layout/Header.jsx` (sticky `h-16 lg:h-20`, logo left, hamburger right, desktop `SiteNav` hidden on mobile). Search is `HeaderSearch.jsx` inside header, not full-width below. Hero is `HeroSection.jsx` (video `min-h-[400px] sm:min-h-[460px]` absolute). Stats `CommunityStats.jsx` is likely 3-row stacked. Destination `DestinationExplorer.jsx:36-75` uses `h-[210px] w-[165px] rounded-full` (too large, 165px) + `h-4 w-20` text skeleton. Promo `PromoBannerCarousel.jsx` is a banner. Upcoming `UpcomingTripsSection.jsx` uses `HorizontalCarousel` with `w-[15rem] sm:w-[17rem]` and shows 2 full cards side-by-side, not 1.1 peeking. Book `BookWithConfidence.jsx` is 3+2 grid already but with large padding. Vibe `VibeWithUs.jsx:161` is `h-[550px] w-[320px]` (too large for mobile, should be ~1.1 visible). WhyChooseUs `WhyChooseUs.jsx:40-54` is 3+2 cards but with large emoji and padding. Trending `TrendingDestinations.jsx` we just changed to 6-col desktop, 2-col mobile, but reference mobile shows 2 per row with `Trending` + `Recommended` tabs. Reviews `ReviewsFromTravellers.jsx:55` is 2-col grid on desktop but on mobile currently vertical stacked 1-col full-width (too tall `h-52` image). FAQ `HomepageFaqSection.jsx` is light gray `rounded-2xl` with `px-5` — close but needs typography/spacing refinement. Loved `LovedByTravellers.jsx` has blank white space (async skeleton `h-48` with no content). Blogs `RelatedBlogs.jsx` vertical stack. Footer `Footer.jsx` + `FooterInfo.jsx`/`FooterDestinations.jsx` + `FooterPromo.jsx` is 3-column grid, not accordion. Bottom nav is `client/src/components/layout/BottomNav.jsx` (needs check) — currently near reference but needs `TRIPS` label and safe-area.

**Gaps vs reference:**
1. Header: logo left/hamburger right vs ref: hamburger left, centered logo, phone right.
2. Search: in header vs ref: full-width pill below header.
3. Hero: 400px min-h vs ref: full-width, no rounded.
4. Stats: 3 stacked rows vs ref: compact 3-col horizontal strip (icon + number + label, ~12-14px).
5. Explore: 210x165 oval vs ref: ~90px diameter, horizontal rail, no text skeleton bars.
6. Promo banner: ok but needs mobile full-width, no shimmer.
7. Upcoming: 2 full cards vs 1.1 peek, horizontal scroll + filter pills.
8. BookWithConfidence: already close but needs tighter vertical list on mobile, real icons (now Fa).
9. Vibe: 320x550 vs ref: ~1.1 cards, tall portrait, gap-12.
10. Reasons: 5 cards in sage strip with wavy edges — already correct, just needs mobile typography polish.
11. Trending: 6-col desktop, 2-col mobile is correct, but reference shows `Trending` + `Recommended` tabs — we only have `Trending`.
12. Reviews: vertical 1-col full width vs ref: single card with dots, image top, stars, text, name, pagination.
13. FAQ: light gray, matches ref, needs spacing/row height refinement.
14. Loved: blank space vs ref: should have compact skeleton or real content, not giant white gap.
15. Blogs: vertical stack vs 1.1 horizontal carousel.
16. Footer: 3-col grid vs ref: accordion (Domestic/International/Quick Links/Talk to Us/Address + Follow us).
17. Bottom nav: fixed bottom, safe-area, WhatsApp separate, content padding.

---

## Architecture & File Map

**Keep (reuse, do not rewrite):**
- `client/src/pages/HomePage.jsx` — section order/visibility via `HOMEPAGE_SECTIONS`
- `client/src/services/*` — destinationApi, tripApi, etc.
- `client/src/lib/homeContent.js` — WHY_CHOOSE_US, HOMEPAGE_FAQS (already rewritten)
- `client/src/components/ui/*` — Container, Accordion, etc.
- All DB/API/S3 — no changes

**Modify (mobile-only via `sm:`, `lg:` breakpoints):**
- `client/src/components/layout/Header.jsx` — restructure to hamburger | centered logo | phone (hide desktop SiteNav on mobile, keep lg:block)
- `client/src/components/layout/HeaderSearch.jsx` — ensure pill styling, no focus expansion
- `client/src/components/home/HeroSection.jsx` — adjust `min-h`, `aspect`, `object-fit`, mute button position
- `client/src/components/home/CommunityStats.jsx` — change from stacked to 3-col horizontal
- `client/src/components/home/DestinationExplorer.jsx` — shrink ovals to 80-90px, adjust gap, keep filter logic
- `client/src/components/home/PromoBannerCarousel.jsx` — ensure mobile full-width, no shimmer flash
- `client/src/components/home/UpcomingTripsSection.jsx` — change `itemClassName` to `w-[88vw] sm:w-[380px] lg:w-[320px]` for 1.1 peek, ensure `HorizontalCarousel` has `snap-x snap-proximity`, `gap-3`, `px-5`
- `client/src/components/ui/horizontal-carousel.jsx` — already prod-grade drag, keep but ensure `gap-3` and `snap`
- `client/src/components/home/BookWithConfidence.jsx` — tighten vertical list for mobile (already 3+2, just adjust padding/typography)
- `client/src/components/home/VibeWithUs.jsx` — change `w-[320px] h-[550px]` to responsive `w-[78vw] sm:w-[300px]` for 1.1 peek, keep gap
- `client/src/components/home/WhyChooseUs.jsx` — adjust padding/typography for mobile, keep sage + wave
- `client/src/components/home/TrendingDestinations.jsx` — already 2-col mobile, keep, ensure `gap-3`, `rounded-[16px]`
- `client/src/components/home/ReviewsFromTravellers.jsx` — change from `lg:grid-cols-2` to horizontal single-card carousel with dots (reuse `HorizontalCarousel` or custom)
- `client/src/components/home/HomepageFaqSection.jsx` — adjust `rounded-2xl` width, row height, spacing
- `client/src/components/home/LovedByTravellers.jsx` — replace giant blank with compact skeleton or real content, avoid `h-96` gap
- `client/src/components/home/RelatedBlogs.jsx` — change from vertical stack / `grid` to `HorizontalCarousel` with `w-[85vw]`
- `client/src/components/layout/footer/Footer.jsx` + `FooterInfo.jsx`/`FooterDestinations.jsx`/`FooterDestinations.jsx` — convert 3-col grid to accordion on mobile (`sm:hidden` accordion, `hidden sm:grid` for desktop)
- `client/src/components/layout/BottomNav.jsx` (or equivalent) — ensure fixed bottom, `safe-area` `pb-[env(safe-area-inset-bottom)]`, `border-t`, `bg-white`, `WhatsApp` floating offset `bottom-[72px]`
- `client/src/styles/index.css` — add mobile padding utilities if needed, ensure no horizontal overflow (`overflow-x-hidden` on body already)
- `client/src/pages/TripPage.jsx` / `DestinationPage.jsx` — no changes, but verify sticky header not covering content (already fixed top 104/148)

**New/optional helper:**
- `client/src/components/ui/skeleton.jsx` — already exists with `skeleton` class + shimmer, reuse for new skeletons (Loved, Blogs)

---

## Implementation Phases (Priority: Mobile UX > spacing/density > responsive > polish)

### Phase 1 — Foundation: Header, Search, Hero, Stats (No data changes)
**Files:** `Header.jsx`, `HeaderSearch.jsx`, `HeroSection.jsx`, `CommunityStats.jsx`, `src/styles/index.css`
- **Header:** Restructure `Header.jsx:24-50` to: left `button hamburger` (keep `MobileNav` trigger), center `Logo` with `absolute left-1/2 -translate-x-1/2` to truly center regardless of side widths, right `HeaderPhone` (phone icon only on mobile, as in ref). Keep `PromoBanner` above (already green). White bg, `border-b`, `shadow-header` only where appropriate. Hide desktop `SiteNav` on mobile (`hidden lg:block` already). Ensure `Container` not needed for this row — use `px-5 sm:px-6` for mobile 20-28px.
- **Search:** Move `HeaderSearch` out of header into its own full-width pill directly below header (like ref). In `Header.jsx`, keep desktop search `hidden md:block absolute centered`, but add mobile-only `div md:hidden px-5 py-3 bg-white` with `HeaderSearch` `w-full` `h-11 rounded-full border-slate-300` `pl-11` — no focus expansion, no shimmer.
- **Hero:** Adjust `HeroSection.jsx:54` from `min-h-[400px] sm:min-h-[460px]` to `min-h-[280px] sm:min-h-[360px] lg:min-h-[460px]` or `aspect-[4/3] sm:aspect-[16/9] lg:aspect-[3.17/1]` for mobile impact, `object-cover object-center`, keep `rounded-none` on mobile (full-width edge-to-edge) vs `md:rounded-xl` if needed, mute button `bottom-4 right-4` stays.
- **Stats:** Change `CommunityStats.jsx` from stacked rows to `grid grid-cols-3 gap-2 py-4 bg-[#f0fdf4] border-y` (mint strip), each stat `flex flex-col items-center text-center` with `icon h-6 w-6 text-emerald-600` + `value text-sm font-bold` + `label text-[11px] text-slate-600`, 12-14px, green accents, `px-5` mobile padding.

### Phase 2 — Discovery Rails: Explore + Trending (Density)
**Files:** `DestinationExplorer.jsx`, `TrendingDestinations.jsx`
- **Explore:** Shrink `DestinationOval` from `h-[210px] w-[165px]` → `h-[88px] w-[88px] sm:h-[96px] sm:w-[96px]` (70-100px per spec), keep `rounded-full`, `gap-2` → `gap-3`, `mt-7` → `mt-4`, filter pills `px-3 py-1.5 text-xs` already compact, keep `flex gap-2.5 overflow-x-auto`, remove text skeleton bars (already done). Ensure 4-5 ovals visible per viewport (2 rows, `grid-flow-col grid-rows-2`, `gap-4 sm:gap-6`, `px-5`), horizontal scroll with `scroll-smooth`.
- **Trending:** Already 6-col desktop, 2-col mobile, full-bleed image, gradient, white text, `rounded-[16px]`, `aspect-[3/4]` — keep. Verify `startingPrice` still via `priceMap` from `tripApi.list({limit:50})` (single request). Ensure mobile shows exactly 2 per row, `gap-3`, no white footer, `truncate` for name.

### Phase 3 — Horizontal Carousels: Upcoming, Vibe, Reviews, Blogs (1.1 Peek)
**Files:** `UpcomingTripsSection.jsx`, `HorizontalCarousel.jsx`, `VibeWithUs.jsx`, `ReviewsFromTravellers.jsx`, `RelatedBlogs.jsx`
- **Upcoming:** Change `HorizontalCarousel itemClassName` from `w-[15rem] sm:w-[17rem] lg:w-[18rem]` to `w-[88vw] max-w-[360px] sm:w-[380px] lg:w-[340px]` for 1.1 peek on mobile (280px is 88vw on 375px → next card peeks 12vw). Keep `gap-4`, `px-5` container, `snap-x snap-proximity`. Ensure `See All` stays top-right.
- **Vibe:** Change `VIDEOS` card from `w-[320px] h-[550px]` to `w-[78vw] max-w-[320px] h-[440px] sm:h-[480px] lg:h-[550px]` so on 375px, card is ~292px wide, next peeks ~60px (1.1). Keep `gap-12` (already 3x), `rounded-xl`, mute toggle.
- **Reviews:** Replace `grid lg:grid-cols-2` (2-col desktop, vertical stack mobile) with `HorizontalCarousel` single-card: `itemClassName="w-[90vw] max-w-[400px] sm:w-[380px]"`, image `aspect-[4/3]`, card `rounded-2xl border`, pagination dots `flex justify-center gap-2 mt-4` with `h-2 w-2 rounded-full bg-slate-300 data-[active]:bg-primary` (reuse existing dots logic but ensure mobile shows dots, desktop maybe 2-col? Spec says *One review card visible at a time* on mobile, so carousel with 1.05 peek). Keep 4 reviews (Naval etc.) unchanged.
- **Blogs:** Change `RelatedBlogs.jsx` from `grid` to `HorizontalCarousel` with `w-[85vw] sm:w-[360px]` for 1.1, keep `Read All`.

### Phase 4 — Confidence, WhyChooseUs, FAQ, Loved (Polish)
**Files:** `BookWithConfidence.jsx`, `WhyChooseUs.jsx`, `HomepageFaqSection.jsx`, `LovedByTravellers.jsx`
- **BookWithConfidence:** Already improved with `Fa*` icons + white circles. For mobile, ensure vertical list is compact `gap-4`, `p-4` not `p-8`, icon `h-8 w-8` inside `h-10 w-10` circle, text `text-sm` not `text-[15px]` on mobile, `max-w-5xl mx-auto` kept, `T&C` `text-right text-[11px]` stays.
- **WhyChooseUs:** Keep `WhyChooseUs` 5 cards as is (already rewritten copy), but adjust mobile padding from `py-8 lg:py-10` to `py-6 sm:py-8`, cards `p-4` not `p-6`, `gap-4` not `gap-6`, heading `text-[22px] sm:text-2xl` (already 22-26), ensure wave SVGs `h-4` remain.
- **FAQ:** Already light gray `bg-[#f4f4f5]` `rounded-2xl`, keep. Refine `HomepageFaqSection.jsx` row `py-3.5` (currently `py-4`), `text-[14px]` on mobile vs `text-[15px]` desktop, container `max-w-3xl mx-auto px-5` for mobile 20px.
- **Loved:** Current has blank `h-48` + giant white space. Replace with compact skeleton: if `isLoading`, show `grid grid-cols-2 gap-3` with `aspect-square skeleton` 4 items, `max-w-4xl`; if empty, show `p-6` centered text, not `min-h-[50vh]`. Ensure no `h-[50vh]` blank.

### Phase 5 — Footer & Bottom Nav (Accordion + Safe Area)
**Files:** `Footer.jsx`, `FooterInfo.jsx`, `FooterDestinations.jsx`, `FooterBottom.jsx`, `BottomNav.jsx` (or `MobileNav`/`BottomNav`)
- **Footer:** Convert `FooterInfo` grid `lg:grid-cols-[1.4fr_1fr_1.2fr]` to `hidden sm:grid` for desktop and `sm:hidden` accordion for mobile. Each section (`Domestic Trips`, `International Trips`, `Quick Links`, `Talk to Us`, `Address`) becomes `<details><summary>` or controlled `useState` accordion with `ChevronDown` rotate, `border-t` separator, `py-3` trigger, `text-[15px] font-semibold`. Keep `Follow us on` always expanded with 3 icons (`FaWhatsapp`/`FaInstagram`/`FaFacebookF` `h-[18px]`). Keep `FooterPromo` cream banner as is.
- **Bottom Nav:** Ensure `fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]` with `grid grid-cols-4 gap-1 px-2 py-2` and icons `Home`/`Search`/`TRIPS`/`Play` + separate `WhatsApp` floating `bottom-[76px] right-4` (so not colliding). Add `pb-[72px]` to `PublicLayout`'s `main` or `HomePage`'s last section `pb-20 lg:pb-0` so content not covered. Hide desktop nav duplicate.

### Phase 6 — Global Mobile Spacing & Typography
**Files:** `HomePage.jsx`, `src/styles/index.css`, all home components
- **Page padding:** Ensure `HomePage` sections use `px-5 sm:px-6 lg:px-[90px]` and `py-8 sm:py-10 lg:py-16` consistently, with `max-w-none mx-0` for full-width carousels. Check `w-full px-5` vs `Container` `px-4` — standardize to 20-28px mobile.
- **Typography:** Set `:root` already `system-ui`, keep. Ensure section headings `text-[22px] sm:text-2xl lg:text-[26px]` (not `text-3xl` on mobile), card titles `text-[16px]`, body `text-[13px] sm:text-[14px]`.
- **Overflow:** Add `overflow-x-hidden` on `body` (already), ensure no `w-screen` causing horizontal scroll, check `HorizontalCarousel` `pb-2` not causing overflow, add `max-w-[100vw]` wrapper if needed.
- **Testing:** Run `npm run dev`, test `360/375/390/430` via `Chrome DevTools > Toggle device toolbar`, check `Lighthouse` mobile, verify no horizontal overflow (`document.documentElement.scrollWidth === window.innerWidth`), verify bottom nav doesn't cover `Related Blogs` (add `pb-24` to last section).

---

## Risks & Mitigations

- **Risk:** Changing `Header` to centered logo breaks desktop `SiteNav` alignment (desktop expects `justify-center`).
  - *Mitigation:* Scope mobile changes to `sm:hidden` / `lg:hidden` — keep desktop `hidden lg:block` `SiteNav` and `absolute left-1/2 -translate-x-1/2` search unchanged; only swap hamburger ↔ logo order inside `md:hidden` block.

- **Risk:** `HorizontalCarousel` drag with `snap-mandatory` causes jank on mobile.
  - *Mitigation:* Keep `snap-proximity` (already changed for Explore) and `overscroll-x-contain touch-pan-x`, test with `snap-mandatory` vs `proximity` — use `proximity` for freer swipe.

- **Risk:** `VibeWithUs` 8 videos `320x550` on 375px causes 1.1 peek to be too narrow (78vw = 292px, gap 48px → peek 35px). On 360px, peek is only 26px — may feel cramped.
  - *Mitigation:* Use `w-[82vw]` instead of `78vw` if peek <30px, test at 360/375.

- **Risk:** `TrendingDestinations` with `limit:12` and `featured:true` may return <6 (currently only 1 featured: Singapore), breaking 6-per-row design.
  - *Mitigation:* Keep `limit:12` but allow empty slots to be hidden; design handles 1-6 gracefully (grid auto). Admin can set more `featured` later; don't hardcode fallback to unfeatured.

- **Risk:** Footer accordion JS adds height, pushing `BottomNav` overlap.
  - *Mitigation:* Ensure `Footer` is inside `main` with `pb-[72px]` on `HomePage` last section, and `BottomNav` has `safe-area` padding.

- **Risk:** Overwriting `WhyChooseUs` copy again — task says keep the 5 rewritten reasons (Travel Solo...); ensure we don't revert to old "Solo is safe."
  - *Mitigation:* `homeContent.js` already has correct 5 — do not touch it in this phase.

---

## Verification Plan

1. **Build & Dev:** `npm run dev` → `vite` on `:5173`, no `TRP-` or `featured` schema changes.
2. **Widths:** Chrome DevTools → `360`, `375`, `390`, `430` — check each section:
   - Header: hamburger (left) → centered logo → phone (right), search pill below.
   - Hero: video `aspect-[4/3] sm:aspect-[16/9]`, mute button bottom-right, no empty space.
   - Stats: 3-col `grid-cols-3` with `12px` text, icons.
   - Explore: 70-100px ovals (check `w-[88px] h-[88px]`), 2 rows, horizontal scroll, no text skeleton.
   - Promo: full-width `rounded-xl` with correct `backgroundColor`.
   - Upcoming: filter pills scrollable, cards `w-[88vw]` peek 1.1, `snap` works.
   - Book: 5 items vertical `gap-4`, icons in white circles.
   - Vibe: `w-[78vw]` cards, `gap-12`, 1.1 peek, mute toggle, drag from whole card.
   - WhyChooseUs: sage `bg-[#B5D6D4]`, wave top/bottom, `3+2` cards centered, `Why` heading centered.
   - Trending: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` with overlay gradient, `Starting ₹`.
   - Reviews: single card `w-[90vw]` with dots, image top, stars, text, name.
   - FAQ: `bg-[#f4f4f5]` `rounded-2xl` with `divide-y`, chevron right, `py-3.5`.
   - Loved: no blank, compact skeleton `h-24` if loading, else cards.
   - Blogs: `HorizontalCarousel` with 1.1 cards, `Read Now`.
   - Footer: accordion on mobile (`sm:hidden`), 3-col grid on `sm:grid`, `WhatsApp` floating `bottom-[76px]`.
   - Bottom Nav: `fixed bottom-0` with `TRIPS` center, `safe-area`, content `pb-20`.
3. **No horizontal overflow:** `document.documentElement.scrollWidth === window.innerWidth` at 375, no `w-screen`.
4. **No desktop regression:** `≥1024px` — header `SiteNav` centered, hero `md:aspect-[3.17/1]`, Explore `165px` ovals, Trending `6-col`, etc., match previous desktop screenshots.
5. **No data change:** `grep -r "Capture a Trip" client/src/components/home` still 0, only `24x7Chhutti` remains, `displayOrder` still via `featured` query.

---

## Open Questions (Resolved)

- **Q:** Should Trending show 2 per row on mobile even though reference shows `Bali/Georgia` filters? **A:** Yes — keep 2-col as already implemented, matches reference's 2-col for `Recommended Destinations` (reference 14 onward).
- **Q:** Vibe 1.1 vs 1.05? **A:** Use `78-82vw` to guarantee peek on 360-430, as in reference.
- **Q:** Footer address is `Janak Puri` single line — keep single `AddressBlock` with `View on Map` to `https://maps.app.goo.gl/NPn8DfeDYZCwJYmH9` (already fixed).
