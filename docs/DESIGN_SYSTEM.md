# DESIGN_SYSTEM

UI/design approach and **actual design tokens** for **24x7Chhutti**. This
document records the concrete tokens, header/navigation architecture, and
reusable components established in the Design System + Public Shell milestone.

## Foundation
- **shadcn/ui** for accessible, reusable UI primitives (`client/src/components/ui/`).
- **Tailwind CSS** for styling (utility classes, design tokens).
- **Lucide React** for icons.
- **Sonner** for toasts/notifications.
- Consistent, responsive, accessible across all breakpoints.

> Note: this version of lucide-react (1.x) no longer ships brand icons
> (Facebook/Instagram/Youtube). Social links use generic Lucide icons
> (`Share2`, `AtSign`, `Globe`) instead — no extra icon library is used.

## Logo
`logo.jpg` at the repository root is the **official 24x7Chhutti logo**. It is
referenced by the UI from `client/public/logo.jpg` (identical copy). The logo is
used in the header, footer, and the login modal.

**Do not delete, rename, replace, or modify `logo.jpg`.**

## Actual design tokens

All tokens are defined in `client/tailwind.config.js` and the CSS variables in
`client/src/styles/index.css`.

### Color tokens (HSL in CSS variables, consumed by Tailwind)
| Token               | Value              | Usage |
| ------------------- | ------------------ | ----- |
| `--background`      | `0 0% 100%`        | Page background |
| `--foreground`      | `222 47% 11%`      | Body text (dark navy) |
| `--card`            | `0 0% 100%`        | Card/panel surface |
| `--card-foreground` | `222 47% 11%`      | Card text |
| `--popover`         | `0 0% 100%`        | Dropdown/drawer surface |
| `--brand`           | `142 76% 36%`      | Brand green (primary action) |
| `--brand-foreground`| `0 0% 100%`        | Text on brand green |
| `--brand-muted`     | `140 76% 96%`      | Light green tint backgrounds |
| `--primary`         | `142 76% 36%`      | Primary buttons (== brand green) |
| `--primary-foreground` | `0 0% 100%`     | Primary button text |
| `--secondary`       | `210 40% 96%`      | Subtle surfaces |
| `--secondary-foreground` | `222 47% 11%` | Secondary text |
| `--muted`           | `210 40% 96%`      | Muted backgrounds |
| `--muted-foreground`| `215 16% 47%`      | Muted/placeholder text |
| `--accent`          | `210 40% 96%`      | Hover/selected surface |
| `--accent-foreground` | `222 47% 11%`   | Accent text |
| `--destructive`     | `0 72% 51%`        | Error/destructive |
| `--destructive-foreground` | `0 0% 100%` | Destructive text |
| `--border`          | `214 32% 91%`      | Borders |
| `--input`           | `214 32% 91%`      | Input borders |
| `--ring`            | `142 76% 36%`      | Focus ring (brand green) |
| `--radius`          | `0.75rem`          | Base border radius |

Tailwind surfaces: `brand`, `primary`, `secondary`, `muted`, `accent`,
`destructive`, `card`, `popover`, plus `border`, `input`, `ring`.

### Typography
- `font-sans` and `font-display` both use the system UI stack
  (`system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial`).
- Headings use tracking-tight + bold; body uses the default sans stack.
- Sizes follow Tailwind's default scale (`text-sm`, `text-base`, `text-2xl`, …).

### Spacing & container
- Spacing uses Tailwind's default scale (`gap-2`, `px-4`, `py-6`, `mt-6`, …).
- **Container**: centered, max-width `1440px` (`2xl`), responsive padding:
  - base `1rem`, `sm` `1.25rem`, `lg` `2rem`, `xl` `2.5rem`.
- Used via the `Container` component (`container mx-auto w-full`).

### Border radius
- `--radius: 0.75rem`. Tailwind maps: `lg = radius`, `md = radius - 2px`,
  `sm = radius - 4px`. Buttons/cards use `rounded-md`/`rounded-lg`; pills use
  `rounded-full`.

### Shadows
| Utility            | Value |
| ------------------ | ----- |
| `shadow-card`      | `0 1px 3px rgb(0 0 0 / .06), 0 1px 2px -1px rgb(0 0 0 / .06)` |
| `shadow-card-hover`| `0 8px 24px -6px rgb(0 0 0 / .12), 0 4px 12px -4px rgb(0 0 0 / .08)` |
| `shadow-header`    | `0 1px 2px rgb(0 0 0 / .04), 0 1px 6px rgb(0 0 0 / .04)` |

### Responsive breakpoints
Tailwind defaults: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`
(container caps at 1440px).

### Focus & interaction
- Global `:focus-visible` outline uses `hsl(var(--ring))` (brand green).
- Interactive elements use Tailwind `focus-visible:ring-2 focus-visible:ring-ring`.
- Disabled states use `disabled:opacity-50 disabled:cursor-not-allowed`.

## Component states
Every interactive/data component should handle:
- **Loading states** — skeletons/spinners (e.g. header auth shows a pulse
  skeleton while the session loads).
- **Error states** — friendly messages + retry where appropriate.
- **Empty states** — clear placeholders when there is no data.
- **Disabled/selected/hover/focus** states for interactive elements.

## Header architecture

The header (`client/src/components/layout/Header.jsx`) is a sticky top bar with
two rows:

1. **Top row** (`h-16` mobile, `h-20` desktop):
   - `Logo` (links to `/`)
   - `HeaderSearch` (visual search input, centered, `md+` only)
   - `HeaderAuth` (Login / Sign Up, or authenticated user menu, `sm+`)
   - Mobile hamburger button (opens `MobileNav`)
2. **Nav row** (`lg+` only): `SiteNav` desktop navigation.

### Header components
- `Header` — sticky container composing the pieces; owns mobile-nav open state.
- `SiteNav` — desktop nav from `lib/nav.js`; "More" renders an accessible
  dropdown (click, outside-click, Escape).
- `HeaderSearch` — visual search input; no backend yet (structured for it).
- `HeaderAuth` — shows Login/Sign Up (opens existing `LoginModal`) or an
  authenticated user menu (avatar + mobile + role + Logout).
- `MobileNav` — slide-in drawer (`Sheet`) for mobile; independent of desktop nav.
- `Logo` (`components/brand/Logo.jsx`) — reusable brand logo linking home.

### Authentication integration
- The `LoginModal` is mounted once in `PublicLayout` and controlled by the UI
  store (`stores/ui.js` → `authModalOpen`). The header's Login button calls
  `openAuthModal()`; no duplicate modal or logic is created.
- Authenticated state comes from `useAuth()` (Zustand `stores/auth.js`); the
  user menu shows the mobile number and provides Logout.

## Public layout

`client/src/components/layout/PublicLayout.jsx`:
```
<PublicLayout>
  <Header />
  <main><Outlet /></main>
  <Footer />
  <LoginModal />   (mounted once, driven by ui store)
</PublicLayout>
```
- Restores the session on boot via `fetchMe()`.
- `<main>` grows to fill (`flex-1`) so the footer sits at the bottom.

## Footer architecture

`client/src/components/layout/Footer.jsx`:
- Brand block (logo, tagline, contact placeholders).
- Link columns driven by `FOOTER_NAV` in `lib/nav.js` (Destinations, Support,
  Policies).
- Newsletter block (visual only; signup comes later).
- Bottom bar: copyright + social link placeholders (generic icons).
- No fabricated company details; placeholders are clearly structural.

## Routing structure

`client/src/routes/index.jsx` defines a single `PublicLayout` parent route with
children:
- `/` (HomePage shell)
- `/destinations`, `/destination/:slug`
- `/trips`, `/trip/:slug`
- `/booking/:tripSlug`
- `/blog`, `/blog/:slug`, `/faqs`
- `/about`, `/contact`, `/privacy-policy`, `/terms`
- Marketing placeholders: `/group-trips`, `/deals`, `/travel-styles`,
  `/upcoming-trips`, `/middle-age-trips`, `/customised-trips`, `/more`
- `*` fallback (Page not found)

All non-home routes render `PlaceholderPage` (a "not built yet" shell) so the
navigation has no broken links. Real pages come in later milestones.

## Mobile navigation

- Hamburger button (`aria-label="Open menu"`) opens `MobileNav` (a `Sheet`
  sliding from the right).
- Contains logo, `HeaderSearch`, all nav items (with "More" expandable), and a
  Login/Sign Up or Account action.
- Closes via: close button, backdrop click, or Escape. Body scroll is locked
  while open. Fully keyboard accessible.

## Accessibility
- Semantic HTML and landmarks (`header`, `nav[aria-label]`, `main`, `footer`).
- Labels on all inputs and icon-only buttons (`aria-label`).
- Keyboard navigation: all nav/controls are reachable, focus-visible rings are
  visible, dialogs/drawers close with Escape.
- ARIA attributes: `aria-haspopup`, `aria-expanded`, `role="dialog"`,
  `aria-modal`, `aria-label`.
- Contrast follows the token palette (dark text on light surfaces).

## Performance
- Shell is lightweight; no additional UI/icon/animation libraries were added.
- Simple CSS/Tailwind transitions only.

## Status
**IMPLEMENTED** (Design System + Public Website Shell + Homepage + Trip
Discovery). Destination/trip/trip-batch pages and the `/trips` discovery
experience are implemented; booking/reviews/blogs remain PLANNED (see
`docs/ROADMAP.md` and `docs/CURRENT_STATE.md`).

## Trip discovery page (/trips)
- Layout: heading + intro → category pills (All/Domestic/International) →
  destination tabs (rounded-full pills, horizontally scrollable) → controls row
  (search, sort, mobile Filters button) → filter chips → `lg:grid-cols-[260px_1fr]`
  split (filter sidebar + results grid).
- Results grid: `sm:grid-cols-2 xl:grid-cols-3` with portrait `aspect-[3/4]`
  cards (`TripCard`) matching the reference card proportions.
- Filter sidebar: rounded-xl bordered card with grouped sections (dates, trip
  type, domestic/international, destinations, budget) separated by
  `border-b border-border`; pill/chip toggles reuse the tab styling.
- Mobile filters use the existing `Sheet` drawer (right side, Escape-to-close,
  scroll-locked), reusing the identical `TripFilterPanel` component.
- Active filters render as removable muted chips with a "Clear all" action.
- Pagination uses numbered round buttons with prev/next chevrons.
- All controls carry visible labels or accessible names; focus rings come from
  the global `:focus-visible` token.

## Homepage sections & carousels
- Homepage sections live in `components/home/` and use the design tokens above
  (rounded-xl cards, `shadow-card`/`shadow-card-hover`, brand-green accents).
- Section rhythm: alternating `bg-background` and `bg-muted/30` bands separated
  by `border-y border-border`; consistent `py-12 lg:py-16` spacing.
- Destination tiles and trip cards use the `aspect-[4/5]` image ratio (similar
  to the reference's card proportions), with `DestinationImage` fallback.
- Horizontal carousels use `components/ui/horizontal-carousel.jsx`: CSS
  `snap-x` scroll snapping + native `overflow-x-auto` + accessible prev/next
  buttons. Items are `shrink-0` so they overflow and scroll; on mobile the
  carousel is touch-scrollable.
- Tabs (destination categories, trip destinations) use rounded-full pills
  (`bg-primary` active, bordered inactive).
- FAQ accordion uses `components/ui/accordion.jsx` (single-open, accessible).