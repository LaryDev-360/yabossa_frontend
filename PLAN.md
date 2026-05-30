# TwoFStock — frontend implementation plan

This document tracks **Phase 7 (client)** work for the TwoFStock web app. It builds on the **TailAdmin React** template in this directory and consumes the Django API documented in [`../backend/PLAN.md`](../backend/PLAN.md) and at **`/api/v1/docs/`** when the backend is running.

---

## Goals

- Ship a **role-aware** admin UI for merchants, cashiers, and admins.
- Reuse TailAdmin **layout, forms, tables, charts, and auth shells**; replace demo ecommerce content with real API data.
- Keep the client **thin**: business rules stay on the backend; the UI handles auth, navigation, forms, lists, and error display.
- Support **local dev** (Vite proxy → Django) and a path to **production** static hosting + API on another origin.

---

## Template baseline (TailAdmin React 2.x)

| Area | Current stack |
|------|----------------|
| Framework | React 19, TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 |
| Routing | React Router 7 (`react-router`) |
| Charts | ApexCharts (`react-apexcharts`) — reuse for dashboard |
| Dates | flatpickr — reuse for sale period / filters |
| Layout | `src/layout/AppLayout.tsx`, `AppSidebar`, `AppHeader` |
| Auth shells | `src/pages/AuthPages/SignIn.tsx`, `SignUp.tsx`, `SignInForm`, `SignUpForm` |
| Demo home | `src/pages/Dashboard/Home.tsx` + `src/components/ecommerce/*` (placeholder metrics) |

**Template cleanup (early):** Remove or hide demo routes (calendar, UI element gallery, blank pages) from `App.tsx` and `AppSidebar.tsx` once real nav exists. Keep reusable primitives under `src/components/form`, `ui`, `tables`, `common`.

---

## API contract

- **Base URL:** `VITE_API_BASE_URL` (e.g. `http://127.0.0.1:8001/api/v1` in dev).
- **Auth:** JWT Bearer (`POST /auth/token/`, `POST /auth/token/refresh/`, `POST /auth/logout/` with refresh body).
- **Schema:** OpenAPI at `{API}/schema/`; Swagger UI at `{origin}/api/v1/docs/` (backend).
- **Errors:** DRF JSON (`detail`, field keys, `non_field_errors`). Map **403** subscription gate to a dedicated “subscription inactive” banner/modal.
- **Idempotency:** Sales `reference` per location — surface in POS UI and show **409** on duplicate.

Optional later: generate TypeScript types from OpenAPI (`openapi-typescript` or similar); start with hand-written types in `src/api/types/` aligned to serializers.

---

## Architecture conventions

```text
frontend/src/
  api/           # client, interceptors, endpoint functions
  auth/          # token storage, AuthProvider, protected routes
  features/      # domain modules (shops, products, stock, sales, …)
  pages/         # route-level composition (may wrap features)
  components/    # shared UI (keep TailAdmin building blocks)
  layout/        # AppLayout, sidebar, header
  hooks/
  context/
```

- **Feature folders:** `features/<domain>/` with `api.ts`, `types.ts`, `components/`, optional `hooks/`.
- **No business logic duplication:** e.g. stock thresholds and subscription rules are enforced server-side; UI only displays `is_operational` and error messages.
- **Role-based nav:** Build sidebar from `user.role` (`MERCHANT` | `CASHIER` | `ADMIN`) after `GET /auth/me/`.

---

## Role matrix (UI capabilities)

| Capability | Merchant | Cashier | Admin |
|------------|----------|---------|-------|
| Register / sign in | ✓ (register) | ✓ (login only) | ✓ (login) |
| Dashboard summary | ✓ | ✓ | ✓ (+ optional `merchant_id` filter) |
| Shops / locations | CRUD | Read | CRUD |
| Categories / products | CRUD | Read | CRUD |
| Stock lines / alerts | CRUD / resolve | Read | CRUD / resolve |
| Record sale (POS) | ✓ | ✓ | ✓ (pick merchant or cashier) |
| Sales history | ✓ | ✓ | ✓ |
| Cashiers | Create | — | — |
| Subscription | `GET /subscriptions/me/` | — (inherits shop merchant gate) | List / PATCH all |
| Profile / password / OTP | ✓ | ✓ | ✓ |

When **`ActiveSubscriptionPermission`** blocks a write, show a clear upgrade/renew message using copy from API `detail`.

---

## Phase F0 — Foundation

**Status: implemented**

- **`.env.example`** / **`.env`**: `VITE_API_BASE_URL=/api/v1`, `VITE_APP_NAME=TwoFStock`.
- **`src/api/`** — `client.ts` (`apiRequest`, refresh on 401), `auth.ts`, `types.ts`, `errors.ts`, `config.ts`.
- **`src/auth/`** — `tokenStorage` (localStorage), `AuthContext`, `ProtectedRoute`, `GuestRoute`.
- **Vite proxy** — `/api/v1` → `http://127.0.0.1:8001` in `vite.config.ts`.
- **Auth UI** — `SignInForm` → `POST /auth/token/`; `SignUpForm` → `POST /auth/register/merchant/`; `ResetPassword` → `POST /auth/password/reset/request/`.
- **Email OTP** — after register/sign-in (if unverified): `/verify-email` auto-sends code via `POST /auth/otp/request/`, verifies with `POST /auth/otp/verify/`; `EmailVerifiedRoute` blocks dashboard until `email_verified_at` is set.

### Internationalization (i18n)

**Status: implemented** for implemented pages (English + French).

- **`src/i18n/`** — `I18nProvider`, `useTranslation()`, locale files `locales/en.ts` and `locales/fr.ts`.
- **Persistence:** `localStorage` key `twofstock_locale`; default from browser (`fr*` → French, else English).
- **`LanguageSwitcher`** — EN / FR toggle on auth forms, verify/reset pages, and app header.
- **Translated:** sign-in, sign-up, verify email, reset password (request + confirm), auth layout tagline, loading states, dashboard meta, user menu, role labels.
- **API error messages** from the backend remain in English until a server-side i18n layer exists; UI chrome and fallbacks are translated.
- **Routes** — protected `AppLayout` routes; guest `/signin`, `/signup`, `/reset-password`.
- **Header** — `UserDropdown` shows user + sign out (`POST /auth/logout/`).
- **Production note:** configure Django **CORS** when the SPA is served from a different origin than the API.

---

## Phase F1 — Identity & profile

**Status: implemented**

| Screen / flow | API |
|---------------|-----|
| Merchant registration | `POST /auth/register/merchant/` → store tokens + user |
| Sign in | `POST /auth/token/` |
| Sign out | `POST /auth/logout/` + clear tokens |
| Profile | `GET/PATCH /auth/me/` |
| Change password | `POST /auth/password/change/` |
| Forgot password | `POST /auth/password/reset/request/` |
| Reset password page | `/reset-password?uid=&token=` → `POST /auth/password/reset/confirm/` (align with `PASSWORD_RESET_LINK_BASE`) |
| Email verify (optional) | `POST /auth/otp/request/`, `POST /auth/otp/verify/` |

- **`/profile`** — overview card (name, email, role, verification status), role-aware edit form (`features/profile/`), change-password form (signs out on success).
- **Header `UserDropdown`:** name, role, profile link, logout.
- **Sign-in:** shows success banner after password change redirect.

---

## Phase F2 — Shops & catalog

**Status: implemented**

| Screen | API |
|--------|-----|
| Shops list / create / edit | `/shops/` |
| Locations (nested under shop) | `/shops/{id}/locations/` |
| Categories | `/categories/` |
| Products | `/products/` (archive via `is_archived`) |

- **`/shops`**, **`/shops/:shopId/locations`**, **`/categories`**, **`/products`** — list + modal forms; cashiers read-only (no create/edit/delete).
- Shop delete surfaces **409** when locations exist.
- Products use archive/restore (`PATCH is_archived`) instead of hard delete.
- Sidebar nav updated; demo TailAdmin gallery removed from sidebar.

---

## Phase F3 — Stock

**Status: not started** (backend Phase 3)

| Screen | API |
|--------|-----|
| Stock by location | `GET/POST /locations/{id}/stock/`, `PATCH/DELETE .../stock/{id}/` |
| Alerts list | `GET /stock/alerts/?status=OPEN` |
| Resolve alert | `PATCH /stock/alerts/{id}/` (`status: RESOLVED`) |

- Low-stock badges on stock table when `quantity <= low_stock_threshold`.
- Link alerts to location + product detail.

---

## Phase F4 — Sales (POS)

**Status: not started** (backend Phase 4)

| Screen | API |
|--------|-----|
| New sale (cart) | `POST /sales/` — `location`, `reference`, `items[]` |
| Sale detail | `GET /sales/{id}/` |
| Sales list | `GET /sales/` |

- **POS flow:** pick location → scan/search products → quantities → client-generated `reference` (UUID or POS receipt id).
- Handle **400** (stock, archived product, unknown product) and **409** (duplicate reference).
- **Admin:** optional merchant/cashier attribution fields on create.

---

## Phase F5 — Subscription

**Status: not started** (backend Phase 5)

| Screen | API |
|--------|-----|
| Merchant billing status | `GET /subscriptions/me/` — show `status`, trial dates, `is_operational` |
| Admin subscriptions | `GET/PATCH /subscriptions/`, `.../{id}/` |

- Global **subscription banner** when `is_operational === false` on gated actions.
- Merchant: read-only except contact/support CTA (no self-serve payment in v1 unless added later).

---

## Phase F6 — Dashboard

**Status: not started** (backend Phase 6)

| Screen | API |
|--------|-----|
| Home dashboard | `GET /dashboard/summary/?from=&to=&shop_id=` |

- Replace `EcommerceMetrics`, `MonthlySalesChart`, `RecentOrders`, etc. with:
  - **KPI cards:** `sale_count`, `revenue_total`, `profit_total`
  - **Low stock:** `open_alerts_count`, `stock_lines_at_or_below_threshold`
  - **Top products:** table or bar chart from `top_products`
- Date range: flatpickr → `from` / `to` query params (defaults: last 30 days).
- Optional shop filter for merchants with multiple shops.

---

## Phase F7 — Production & quality

**Status: not started** (client half of backend Phase 7)

### Frontend delivery

- **`npm run build`** → static assets (`dist/`); serve via nginx, S3+CloudFront, or platform static host.
- **Env at build time:** inject `VITE_API_BASE_URL` for each environment.
- **Routing:** configure server **SPA fallback** to `index.html` for client routes (`/signin`, `/sales`, …).

### Quality

- **ESLint** (already in template); add **Prettier** if team prefers.
- **E2E (optional):** Playwright against dev stack for login + one sale happy path.
- **API contract check (optional CI):** diff generated types vs OpenAPI schema from backend.

### Backend coordination (not in this repo folder)

- HTTPS, `DEBUG=0`, Postgres, secrets, rate limits, monitoring — see backend Phase 7 / ops runbooks.
- Ensure **`PASSWORD_RESET_LINK_BASE`** points to this app’s reset route.

### Security checklist

- Do not log tokens; clear storage on logout.
- Prefer **short-lived access** + refresh rotation (already on API).
- XSS: avoid `dangerouslySetInnerHTML` on API error text; sanitize if rich HTML is ever shown.

---

## Suggested route map

| Path | Page | Roles |
|------|------|-------|
| `/` | Dashboard (F6) | All |
| `/signin` | Sign in | Public |
| `/signup` | Merchant register | Public |
| `/reset-password` | Password reset confirm | Public |
| `/profile` | Profile & security | Auth |
| `/shops` | Shops | M, A (C read) |
| `/shops/:shopId/locations` | Locations | M, A (C read) |
| `/categories` | Categories | M, A (C read) |
| `/products` | Products | M, A (C read) |
| `/locations/:locationId/stock` | Stock | M, A (C read) |
| `/stock/alerts` | Alerts | M, A (C read) |
| `/sales` | Sales list | All |
| `/sales/new` | POS | M, C, A |
| `/sales/:id` | Sale detail | All |
| `/cashiers` | Cashiers | M |
| `/subscription` | My subscription | M |
| `/admin/subscriptions` | Subscriptions admin | A |

Remove template-only routes (`/calendar`, `/form-elements`, `/alerts`, …) from production nav when F2+ screens exist.

---

## Dependency overview

```text
F0 (API + auth shell)
  → F1 (profile, password, OTP)
  → F2 (shops, catalog)
  → F3 (stock)
  → F4 (sales / POS)
  → F5 (subscription UX + gates) — can start banner in parallel with F2
  → F6 (dashboard — needs F4 data for meaningful charts)
  → F7 (build, deploy, hardening)
```

Backend phases **0–6 are implemented**; frontend phases can proceed in order without waiting on new API work unless gaps are found during integration.

---

## Out of scope (v1)

- Native mobile apps.
- Offline POS / sync queues.
- Payment processor checkout (subscription billing UI only displays API state).
- Real-time websockets for stock (polling or manual refresh is enough for v1).
- Backend API message localization (DRF responses stay English).

---

## Local development

```bash
cd frontend
npm install
cp .env.example .env   # after F0: set VITE_API_BASE_URL
npm run dev            # default Vite port 5173
```

Run backend on **8001** (or proxy target). Open Swagger at `http://127.0.0.1:8001/api/v1/docs/` for manual API checks.

---

## Status tracking

| Phase | Description | Status |
|-------|-------------|--------|
| F0 | API client, auth, env, proxy | **Implemented** |
| F1 | Login, register, profile, passwords, OTP | **Implemented** |
| F2 | Shops, locations, categories, products | **Implemented** |
| F3 | Stock & alerts | Not started |
| F4 | Sales / POS | Not started |
| F5 | Subscription UI & gates | Not started |
| F6 | Dashboard wired to `/dashboard/summary/` | Not started |
| F7 | Production build & deploy | Not started |

Update this table as phases complete.
