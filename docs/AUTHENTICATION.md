# AUTHENTICATION

Authentication architecture for **24x7Chhutti**. This milestone implements a
mobile-number (OTP) login/signup flow.

## Overview

The platform authenticates customers by **Indian mobile number** via a
one-time-password (OTP) flow. On successful OTP verification the server issues a
JWT and stores it in an **HTTP-only cookie**. The frontend derives its
authenticated state from the server via `GET /api/auth/me`.

```
User clicks Login / Sign Up
        ↓
Login modal opens
        ↓
Enter Indian mobile number (+91)
        ↓
Send OTP
        ↓
OTP verification screen
        ↓
Verify OTP
        ↓
Create/find user  (find-or-create on first verification)
        ↓
Issue JWT + set HTTP-only cookie
        ↓
Authenticated React state (via GET /api/auth/me)
```

## User model

Located at `server/src/models/User.js`. Key fields:

- `mobile` — 10-digit Indian mobile number (stored without the country code)
- `countryCode` — e.g. `+91` (default)
- `name`, `email` — profile fields, added later
- `role` — `user` | `staff` | `admin` (default `user`; used for RBAC, see `docs/ADMIN.md`)
- `mobileVerified` — boolean verification state
- `lastLoginAt`, `isActive`, timestamps

Constraints:
- Unique index on `(countryCode, mobile)`
- Sparse unique index on `email`
- `mobile` regex `^[0-9]{10}$`; `countryCode` regex `^\+\d{1,4}$`

The model also exports `toPublicUser(user)` which strips sensitive/internal
fields (`_id`, `__v`) and normalises the shape returned to clients.

## OTP lifecycle

Flow:
1. `POST /api/auth/send-otp` → service generates a 6-digit OTP, stores it with an
   expiry (`OTP_TTL_SECONDS`, default 300s).
2. `POST /api/auth/verify-otp` → service checks the stored OTP.
   - Not found → `NO_OTP_REQUESTED`
   - Expired → `OTP_EXPIRED` (and the record is removed)
   - Mismatch → `OTP_INVALID` (record kept so a later correct attempt works)
   - Match → record removed (single-use) and the user is authenticated.

OTPs are stored in an in-memory TTL map inside `server/src/services/otp.service.js`.

### Development / mock OTP behavior

- **There is no real SMS sending.** This is a mock service.
- In development (`NODE_ENV !== 'production'`), `send-otp` echoes the generated
  OTP back in the response as `data.devOtp` so the flow can be tested.
- The response also includes `ttlSeconds` and `expiresAt`.
- Example response:

```json
{
  "success": true,
  "data": {
    "expiresAt": 1787585660488,
    "ttlSeconds": 300,
    "devEchoOtp": true,
    "devOtp": "742548"
  }
}
```

- `OTP_ENABLED=false` disables the OTP service entirely.

### Production behavior (future)

- OTPs will be sent via a real SMS provider (Nodemailer/SMS gateway) in a later
  milestone.
- `devEchoOtp` will be `false`; the OTP will **never** appear in an API response.
- OTP storage may move to a persistent store/Redis, but the service interface
  (`createOtp`, `verifyOtp`, `clearOtp`) is designed to be replaced without
  touching the rest of the auth flow.

## Demo admin login

For easy testing of the admin panel without manual DB seeding, the mobile
number `9876543210` (country code `+91`) is promoted to the `admin` role on OTP
login:

1. Enter `9876543210` in the Login modal (or `POST /api/auth/send-otp`).
2. Use the demo OTP `123456` (the fixed development mock value).
3. On verification the find-or-create user is assigned `role: 'admin'`, so the
   account can access `/admin`.

This is **development-only** behavior in `server/src/services/auth.service.js`
(`DEMO_ADMIN_MOBILE`). Never rely on it in production — remove the promotion
logic and assign roles through a controlled admin flow instead.

## JWT

- Signed with `JWT_SECRET` (see `.env.example`).
- Payload: `{ sub: <userId>, role }`.
- Lifetime: `JWT_EXPIRES_IN` (default `7d`).
- Helpers in `server/src/utils/tokens.js` (`signToken`, `verifyToken`).

## HTTP-only cookies

- Cookie name: `chhutti_token`.
- Set on `verify-otp` success and cleared on `logout`.
- Cookie options (see `config.cookie` in `server/src/config/index.js`):

| Setting   | Development | Production |
| --------- | ----------- | ---------- |
| `httpOnly`| `true`      | `true`     |
| `secure`  | `false`     | `true`     |
| `sameSite`| `lax`       | `none`     |
| `maxAge`  | 7 days      | 7 days     |

- **JWT is never stored in `localStorage`.** It lives only in the HTTP-only
  cookie, which is not readable by JavaScript.
- The client sends credentials with `withCredentials: true` (see
  `client/src/services/http.js`); the server enables `credentials: true` in CORS.

## Auth middleware

Located at `server/src/middleware/auth.js`:

- `requireAuth` — protects routes. Reads the cookie, verifies the JWT, loads the
  user, rejects with 401 if missing/invalid/inactive.
- `optionalAuth` — attaches the user if a valid cookie is present but never
  rejects; used for routes that work for guests and logged-in users alike.
- `setAuthCookie` / `clearAuthCookie` — helpers to set/clear the cookie.

## API endpoints

Base: `/api/auth`

| Method | Path          | Auth  | Purpose                                        |
| ------ | ------------- | ----- | ---------------------------------------------- |
| POST   | `/auth/send-otp` | none | Request an OTP for a mobile number             |
| POST   | `/auth/verify-otp` | none | Verify OTP, create/find user, set auth cookie |
| GET    | `/auth/me`    | JWT   | Return the current authenticated user          |
| POST   | `/auth/logout`| none  | Clear the auth cookie                          |

Response envelope follows the project convention:
`{ success: true, data }` on success; `{ success: false, message, errors? }` on
failure.

### Validation (server)

`server/src/validators/auth.validator.js` (Zod):
- `mobile` — `^[6-9]\d{9}$` (valid 10-digit Indian number)
- `countryCode` — `^\+\d{1,4}$`
- `otp` — `^\d{6}$` (exactly 6 digits)

## Frontend auth state

- **Zustand store** `client/src/stores/auth.js` holds `user`, `status`, and
  actions (`fetchMe`, `logout`, `setAuthenticated`, `clearSession`).
  Status values: `loading` | `authenticated` | `unauthenticated`.
- **Reusable hook** `client/src/hooks/useAuth.js` exposes `user`, `status`,
  `isAuthenticated`, `isLoading`, `fetchMe`, `logout`, `setAuthenticated`,
  `clearSession`. Future pages can use `useAuth()` to guard routes and render UI.
- On app boot the scaffold calls `fetchMe()` to restore the session from the
  cookie.
- **API layer** `client/src/services/auth.js` wraps the four endpoints.
- **Schemas** `client/src/schemas/auth.js` (Zod) mirror server validation for
  the phone and OTP forms.

## Login / Sign Up modal

`client/src/components/auth/LoginModal.jsx`:
- Two steps: **phone** then **OTP**.
- Phone step: logo, "Login or Sign Up", "Enter your mobile number", `+91` code +
  phone input, terms checkbox (T&C + Privacy links), and a **Send OTP** button
  that stays disabled until the phone and terms are valid (React Hook Form
  `mode: 'onChange'`).
- OTP step: 6-digit OTP input, **Verify OTP** button (disabled until 6 digits),
  resend with a 30s countdown, and "Change phone number".
- Uses the shared `Dialog` primitive (dark backdrop, centered card, rounded
  corners, close button, Esc-to-close, scroll lock, focus handling).
- Uses `Sonner` toasts for success/error feedback.

## Security notes

- Never commit secrets or `.env` files; use env vars.
- No JWT in `localStorage`.
- API inputs are validated (Zod) on the server.
- OTPs expire and are single-use; malformed OTPs are rejected.
- Sensitive info is not logged.

## Future work

- Real SMS provider for OTP delivery (replaces the mock service).
- Password/email login for staff/admin.
- Role-based access control on routes.
- Refresh tokens / token rotation.
