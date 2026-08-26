# 24x7Chhutti

A production-quality **travel-commerce website**. 24x7Chhutti will eventually let
customers browse travel destinations, explore trip packages with individual
departure batches, and book trips online. The platform is inspired in spirit by
modern travel platforms, but the implementation is entirely our own.

> The repository's `logo.jpg` is the **official 24x7Chhutti project logo**. It
> must be preserved exactly — do not delete, rename, replace, or modify it. It
> will be used in the website header, authentication UI, footer, and other
> appropriate places during UI development.

## Technology stack

| Layer     | Technology |
| --------- | ---------- |
| Frontend  | React.js + Vite + JavaScript + React Router + Tailwind CSS + shadcn/ui |
| Data      | TanStack Query, Zustand, React Hook Form, Zod, Axios |
| Backend   | Node.js + Express.js + JavaScript, REST API |
| Database  | MongoDB + Mongoose |

Additional tools (Lucide React, Sonner, date-fns) and later-stage libraries
(JWT, bcrypt, Multer, Cloudinary, Nodemailer, Razorpay, Recharts, TanStack
Table) are planned as their features are built.

## Repository structure

```
24x7Chhutti/
│
├── client/                  # React + Vite frontend
│   └── src/
│       ├── components/      # ui/, layout/, trips/, destinations/, booking/, admin/
│       ├── pages/           # route-level pages
│       ├── routes/          # React Router config
│       ├── hooks/           # custom hooks
│       ├── services/        # centralized API calls
│       ├── stores/          # Zustand stores
│       ├── schemas/         # Zod schemas
│       └── lib/             # utilities
│
├── server/                  # Node + Express REST API
│   └── src/
│       ├── config/          # env, db connection, app config
│       ├── controllers/     # HTTP layer
│       ├── middleware/      # auth, errors, validation
│       ├── models/          # Mongoose models
│       ├── routes/          # Express routers
│       ├── services/        # business logic
│       ├── validators/      # input validation
│       └── utils/           # helpers
│
├── shared/                  # code shared between client and server
├── docs/                    # project documentation
├── logo.jpg                 # OFFICIAL project logo (preserved)
├── AGENTS.md                # primary AI-agent instruction file
├── CLAUDE.md
├── README.md
├── .env.example
├── .gitignore
└── package.json             # npm workspaces root
```

## Development setup

**Prerequisites:** Node.js >= 18, npm, MongoDB (later stages).

```bash
# 1. Install all workspace dependencies
npm install

# 2. Prepare environment variables
cp .env.example .env
```

### Frontend startup

```bash
npm run dev:client
# Vite dev server, defaults to http://localhost:5173
```

### Backend startup

```bash
npm run dev:server
# Express API, defaults to http://localhost:5000
```

Health check: <http://localhost:5000/api/health>

### Development utilities

```bash
npm run build:client     # production build of the frontend
npm run preview:client   # preview the production build
npm run start:server     # run the backend in production mode
```

## Environment variables

See `.env.example` for the full list. Key variables:

| Variable        | Purpose                                   | Default                        |
| --------------- | ----------------------------------------- | ------------------------------ |
| `PORT`          | Express API port                          | `5000`                         |
| `CLIENT_ORIGIN` | Allowed browser origin for CORS           | `http://localhost:5173`        |
| `NODE_ENV`      | Runtime environment                      | `development`                  |
| `VITE_API_URL`  | API base URL used by the frontend axios   | `/api`                         |
| `VITE_PROXY_TARGET` | Backend target for the Vite dev proxy | `http://localhost:5000`     |
| `MONGODB_URI`   | MongoDB connection string                | `mongodb://127.0.0.1:27017/...` |
| `JWT_SECRET`    | JWT signing secret (set a real value)     | dev-only default              |
| `JWT_EXPIRES_IN`| JWT lifetime                             | `7d`                          |
| `OTP_TTL_SECONDS` | OTP validity in seconds                | `300`                         |

Never commit a real `.env` file. Keep `.env.example` in sync.

## Documentation

All project documentation lives in `docs/`:

- `PROJECT_OVERVIEW.md` — planned product features
- `ARCHITECTURE.md` — system architecture
- `DATABASE.md` — MongoDB entities
- `API.md` — REST API
- `AUTHENTICATION.md` — authentication architecture & OTP flow
- `FRONTEND.md` — frontend conventions
- `ADMIN.md` — planned admin/CMS
- `BOOKING_SYSTEM.md` — planned booking flow
- `DESIGN_SYSTEM.md` — UI/design approach
- `DEVELOPMENT_RULES.md` — strict development rules
- `DECISIONS.md` — architecture decision log (ADRs)
- `ROADMAP.md` — phased roadmap
- `CURRENT_STATE.md` — handoff/checkpoint for AI agents

`AGENTS.md` is the primary instruction file for AI coding agents.

## Current project status

**Status: PHASE 6 — CAPTURE A TRIP-STYLE HOMEPAGE COMPLETE.**

The repository contains the project logo (`logo.jpg`), a MERN foundation, a
working **mobile-number OTP login/signup** flow, a public website shell, an
**admin foundation with RBAC**, a **destination system**, a **trip system**, and
a **real homepage**:

- **Design system & public shell:** brand design tokens, `PublicLayout`
  (`Header`, `Footer`, mobile navigation), and public routing.
- **Admin:** `/admin` with `AdminLayout`, config-driven `AdminSidebar`,
  `AdminHeader`, dashboard, and RBAC (backend-enforced
  `requireAuth` + `requireRole('admin')`).
- **Destinations:** Mongo `Destination` model (unique slugs, draft/published,
  market `category`), public pages with SEO, and full admin CRUD.
- **Trips:** Mongo `Trip` model with embedded itinerary, inclusions/exclusions,
  important info, and FAQs, linked to a Destination. Server-generated `tripCode`,
  unique slugs, draft/published workflow, admin CRUD, public pages, SEO.
- **Homepage:** Capture A Trip-style `/` — promotional bar, hero with search
  (→ `/trips?search=`), community stats (no fabricated numbers), Explore
  Destinations with category tabs, Upcoming Group Trips carousel, Book with
  Confidence, Reasons/USPs, Trending Destinations, and clean "coming soon"
  placeholders for reviews/blogs/community-moments/videos. All data comes from
  the real Destination/Trip APIs; no fake business content.
- **Image architecture:** `heroImage` + `gallery` as `{ url, publicId, alt }`;
  URL-based until Cloudinary is integrated.

**Not yet implemented:** TripBatch (departure dates), booking, travellers,
payments, advanced search, reviews, blogs, global FAQs, coupons, wishlist,
notifications, media manager, customer/user management, settings, and real SMS
delivery. See `docs/CURRENT_STATE.md` for the authoritative handoff state and the
roadmap in `docs/ROADMAP.md`.
