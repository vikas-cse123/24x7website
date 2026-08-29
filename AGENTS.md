# AGENTS.md

> Primary instruction file for AI coding agents working on **24x7Chhutti**.
>
> Read this file FIRST. It overrides generic coding habits. Follow it strictly.

---

## 1. Project purpose

24x7Chhutti is a production-quality **travel-commerce website** (a "Capture A Trip"
- style platform in spirit, but entirely our own implementation).

Planned capabilities (built incrementally in later milestones):

- Travel destinations
- Travel trips / packages
- Trip departure batches (a `TripBatch` represents one departure date)
- Trip pricing, itineraries, inclusions/exclusions, galleries
- Reviews, FAQs, blogs
- Search and filters
- Customer accounts (JWT + HTTP-only cookies)
- Enquiries, bookings, traveller management
- Payments (Razorpay)
- Admin / CMS, media management, coupons, notifications
- SEO and analytics

**Current status:** only project initialization is complete. Almost nothing is
implemented. See `docs/CURRENT_STATE.md`.

## 2. Technology stack (LOCKED — non-negotiable)

| Layer     | Technology                                                              |
| --------- | ----------------------------------------------------------------------- |
| Frontend  | React.js + Vite + JavaScript + React Router + Tailwind CSS + shadcn/ui   |
| Data      | TanStack Query, Zustand, React Hook Form, Zod, Axios                     |
| Icons/UX  | Lucide React, Sonner, date-fns                                           |
| Charts    | Recharts (only when charts are actually required)                        |
| Tables    | TanStack Table (only when tables are actually required)                  |
| Backend   | Node.js + Express.js + JavaScript, REST API                              |
| Database  | MongoDB + Mongoose                                                       |
| Auth      | JWT, HTTP-only cookies, bcrypt/bcryptjs (later)                          |
| Media     | Multer + AWS S3                                                        |
| Email     | Nodemailer (later)                                                       |
| Payments  | Razorpay (later)                                                         |

### Never do these without explicit approval

- Never switch MongoDB to PostgreSQL (or any other database).
- Never switch React/Vite to Next.js (or any other framework).
- Never replace Express (or the REST API approach).
- Never switch to GraphQL.
- Never use Firebase or Supabase as the primary backend/database.
- Never replace the selected stack.

Prefer mature, well-known, widely-used packages. Do not install packages
unnecessarily. If you believe another technology is better, do **not** silently
replace the stack — document the suggestion in `docs/DECISIONS.md` and wait for
approval.

## 3. Repository structure

```
24x7Chhutti/
│
├── client/                  # React + Vite frontend (SPA)
│   └── src/
│       ├── components/
│       │   ├── ui/          # shadcn/ui primitives
│       │   ├── layout/      # header, footer, nav, wrappers
│       │   ├── trips/       # trip-related components
│       │   ├── destinations/
│       │   ├── booking/
│       │   └── admin/
│       ├── pages/           # route-level page components
│       ├── routes/          # React Router configuration
│       ├── hooks/           # custom React hooks
│       ├── services/        # centralized API calls (axios)
│       ├── stores/          # Zustand stores
│       ├── schemas/         # Zod validation schemas (shared shape)
│       └── lib/             # utilities (cn, query client, etc.)
│
├── server/                  # Node + Express REST API
│   └── src/
│       ├── config/          # env, db connection, app config
│       ├── controllers/     # HTTP layer: parse request, call service, respond
│       ├── middleware/      # auth, error handling, validation, etc.
│       ├── models/          # Mongoose models
│       ├── routes/          # Express routers
│       ├── services/        # business logic
│       ├── validators/      # input validation
│       └── utils/           # helpers
│
├── shared/                  # code shared between client and server
├── docs/                    # project documentation (read before big changes)
│
├── logo.jpg                 # OFFICIAL project logo — DO NOT delete/replace/modify
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── .env.example
├── .gitignore
└── package.json             # npm workspaces root
```

Do not create placeholder files just to fill directories. Add directories and
files only when they have real content.

## 4. Architecture

```
React + Vite
    ↓
React Router
    ↓
TanStack Query / Axios (centralized services)
    ↓
Express REST API
    ↓
Controllers
    ↓
Services (business logic)
    ↓
Mongoose (data access)
    ↓
MongoDB
```

Key rules:

- Frontend and backend stay **separated**; they communicate only via REST.
- **Business logic lives in backend services**, not controllers.
- **Database access lives in the backend** (Mongoose), never in the frontend.
- React components must not contain large amounts of business logic.
- Build **reusable components**; avoid duplicated logic.
- Functionality must be **database-driven**; never hardcode travel products.
- API communication must be **centralized** (client `services/`), not scattered
  through components.
- Validate API inputs; handle API errors consistently.

## 5. Coding rules

- Keep changes focused and small — the smallest appropriate change.
- Use the existing code style and conventions (ES modules, plain JavaScript).
- Do not add code comments unless they explain non-obvious intent.
- Reuse existing components, services, and utilities before writing new ones.
- Do not install new dependencies without need.
- Never hardcode secrets; always use environment variables.
- Keep `.env.example` updated whenever environment variables change.
- Never commit secrets or `.env` files.

### Frontend conventions

- Functional components + hooks; no class components.
- React Router for navigation; configure routes in `client/src/routes/`.
- All API calls go through `client/src/services/` (axios) using the shared
  `httpClient` instance. Use TanStack Query for server state.
- Use Zustand only for real client state (auth session, UI state, etc.).
- Forms: React Hook Form + Zod schemas (`client/src/schemas/`).
- UI primitives come from shadcn/ui (`client/src/components/ui/`) built on
  Tailwind CSS. Use Lucide React for icons and Sonner for toasts.
- Path alias `@/` maps to `client/src/`.
- Design with responsiveness and accessibility in mind from the start.

### Public website shell conventions

- The public site is wrapped in `PublicLayout` (`components/layout/`); all
  public routes are children of it (`routes/index.jsx`).
- Navigation comes from `lib/nav.js` — the single source of truth for the
  header, mobile nav, and footer. Add/change nav items there.
- There is exactly **one** `LoginModal`, mounted in `PublicLayout` and opened via
  `stores/ui.js` (`openAuthModal`). Never create a second auth modal or duplicate
  auth logic.
- Use the design tokens (colors/spacing/radius/shadows/container) from
  `tailwind.config.js` and `styles/index.css`; do not hardcode styles per
  component.
- Use `useAuth()` for auth state (`isAuthenticated`, `user`, `isLoading`,
  `logout`, `fetchMe`).
- API responses use the envelope `{ success, data, message? }`; when reading the
  authenticated user on the client, access it as `data.data.user` (the response
  body is `{ success, data: { user } }`).

### Backend conventions

- ES modules (`"type": "module"`); `.js` files only.
- Express routes are thin: validate input → call controller → respond.
- Controllers call **services**; services contain business logic and use
  Mongoose models. Keep layers separated.
- REST endpoints grouped under `/api/...` (see `docs/API.md`).
- Respond with a consistent JSON shape:
  - Success: `{ success: true, data, message? }`
  - Error: `{ success: false, message, errors? }`
- Handle async errors in one place (error-handling middleware).
- Validate all API inputs (`server/src/validators/`).

### Admin / RBAC conventions

- Admin APIs live under `/api/admin` and are protected **on the backend** by
  `requireAuth` + `requireRole('admin')` (`server/src/middleware/auth.js`).
  Frontend `RequireAdmin` is UX only.
- Never trust a role from the client; read it from the server-verified user
  (loaded from the DB via the JWT `sub`).
- Roles: `user | staff | admin` (`server/src/utils/roles.js`). A normal `user`
  must not access `/admin`.
- The admin UI is served by `AdminLayout` (`client/src/components/admin/`); its
  sidebar is driven by `client/src/lib/adminNav.js` (single source of truth).
- Unbuilt admin sections render `AdminPlaceholderPage`; do not fabricate data.
- Unauthenticated `/api/admin/*` → 401; authenticated non-admin → 403.

### Destination conventions

- Destinations use a generated, unique, lowercase URL-safe slug
  (`server/src/utils/slugify.js`). On update the slug is preserved unless
  explicitly provided — never regenerate a published destination's slug
  implicitly.
- Destinations have `published` (draft/published). **Public APIs must never
  expose drafts**; drafts are editable in admin and return 404 publicly. No
  preview mode yet.
- Public destination listing supports pagination (`page`, `limit`) and optional
  `country` / `featured` filters.
- Admin destination endpoints live under `/api/admin/destinations` (protected by
  `requireAuth` + `requireRole('admin')`).
- Update schemas must **not** apply Zod defaults, or omitted fields like
  `published`/`featured` get reset on PATCH (see ADR-011).
- Images are `{ url, publicId, alt }`; new uploads stored in AWS S3 (key in `publicId`, S3 URL in `url`/`secureUrl`).
- Public pages set SEO via `useSeo` (`client/src/lib/seo.js`).

### Trip conventions

- Trips belong to a Destination via `destinationId` (validated server-side; a
  clear 400 is returned if the destination does not exist).
- `tripCode` is **server-generated and not client-editable**. Slugs reuse
  `ensureUniqueSlug` and are preserved on update unless explicitly provided.
- Itinerary days, inclusions, exclusions, and trip-specific FAQs are **embedded
  arrays** in the Trip document (no separate collections).
- **Public APIs never expose draft Trips.** Deleting a **published** Trip is
  blocked (400) — unpublish first.
- Trip types are centralised in `server/src/utils/tripTypes.js` (and the client
  mirror `client/src/schemas/trip.js`); do not scatter type strings.
- Base `startingPrice` is the package fallback; departure-specific pricing
  belongs to `TripBatch` (next milestone).

### Homepage conventions

- The homepage (`pages/HomePage.jsx`) composes sections from
  `lib/homeContent.js` (`HOMEPAGE_SECTIONS` order/visibility) — keep it
  config-driven so a future CMS can manage it.
- **Never fabricate business content**: no fake trips, prices, departure dates,
  reviews, testimonials, or statistics. Use real `destinationApi`/`tripApi`
  data, or render a clean "coming soon" placeholder/empty state.
- Carousels use `components/ui/horizontal-carousel.jsx` (CSS scroll snap +
  native scroll); items are `shrink-0`. Add/update homepage sections under
  `components/home/`.

### Authentication conventions

- Mobile-number OTP login/signup. See `docs/AUTHENTICATION.md`.
- JWT is stored in an **HTTP-only cookie** (`chhutti_token`). Never store auth
  tokens in `localStorage` or return them to the client for storage.
- Protect routes with `requireAuth` from `server/src/middleware/auth.js`; use
  `optionalAuth` for guest-or-user routes.
- The OTP service (`server/src/services/otp.service.js`) is a **development mock**:
  it does not send real SMS. In development the OTP is echoed in the response.
  It is designed to be replaced by a real SMS provider later.
- Never log sensitive auth information unnecessarily.

### Database conventions

- MongoDB via Mongoose. Models in `server/src/models/`.
- Trip departure dates are modelled as `TripBatch` — one document per departure
  date with its own pricing and availability. Never collapse batches.
- Do not run destructive database operations without approval.
- Follow the model designs in `docs/DATABASE.md`.

### API conventions

- REST over JSON. `GET` for reads, `POST` for creates, `PUT/PATCH` for updates,
  `DELETE` for deletes.
- Plural resource names: `/api/destinations`, `/api/trips`, `/api/bookings`.
- Document changes to endpoints in `docs/API.md`.

### Documentation rules

- Read `docs/CURRENT_STATE.md` before and after meaningful work.
- Update relevant `docs/*.md` when behaviour changes.
- Log architectural decisions in `docs/DECISIONS.md`.
- Update `docs/CURRENT_STATE.md` after every meaningful milestone.
- Never mark unfinished work as completed; never claim something works unless
  verified.

### Testing expectations

- Important functionality should be verified before claiming it works.
- Verify with real commands (e.g. start the dev servers, hit endpoints).
- Do not mark a task completed until it is actually verified.

## 6. Standard workflow for AI agents

BEFORE making significant changes:

1. Read `AGENTS.md` (this file).
2. Read the relevant documentation in `docs/`.
3. Read `docs/CURRENT_STATE.md`.
4. Inspect the existing implementation.
5. Understand the current architecture.
6. Make the smallest appropriate change.
7. Verify the change.
8. Update documentation when necessary.
9. Update `CURRENT_STATE.md` after meaningful milestones.

## 7. Hard rules (do not violate)

- Never switch MongoDB to PostgreSQL.
- Never switch React/Vite to Next.js.
- Never replace Express.
- Never replace the selected stack without approval.
- Never rewrite working functionality unnecessarily.
- Never delete existing functionality just because another implementation is
  preferred.
- Never delete, rename, replace, or modify `logo.jpg`. It is the official
  project logo and must be preserved exactly.
- Never commit secrets.
- Never modify anything outside this repository.
