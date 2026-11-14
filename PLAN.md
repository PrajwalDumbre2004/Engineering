# Samarth Engineering Works — Parts Tracker — Project Plan

## 1. Context

A mechanical workshop manufactures parts for several client companies. Clients currently have no self-service way to see progress. This app gives them one:

- **Admin (exactly one, the shop owner)** manages companies, company members, projects, parts, and part status.
- **Company users (many per company)** log in and see **read-only** status of their own company's projects/parts only.

Constraints: React frontend, Node.js backend, MongoDB, JWT auth, monorepo, no OTP, minimal files, scalable layout, and a strong industrial look (responsive, animated, 3D).

---

## 2. Tech Stack (kept deliberately small)

| Layer | Choice | Why |
|---|---|---|
| Monorepo | npm workspaces (`client`, `server`) | No extra tooling (no Turborepo/Nx) |
| Frontend | React 18 + Vite, React Router, Tailwind CSS | Fast, responsive utility styling |
| Animation / 3D | `framer-motion`, `three` + `@react-three/fiber` + `@react-three/drei` | Smooth UI motion; procedural 3D gear (no model files to ship) |
| Data fetching | `axios` + small hooks (no Redux) | State is simple; context holds only auth user |
| Backend | Node.js + Express | Familiar, minimal |
| DB | MongoDB + Mongoose | Schema validation, indexes |
| Auth | `jsonwebtoken`, `bcryptjs` | JWT + hashed passwords |
| Validation | `zod` | One schema per request body |
| Security | `helmet`, `cors`, `express-rate-limit`, `cookie-parser` | Baseline hardening |

---

## 3. Project Structure

```
mech-shop/
├─ package.json                # workspaces + root scripts (dev, build, seed)
├─ .gitignore
├─ README.md                   # setup + run steps
├─ client/
│  ├─ package.json
│  ├─ vite.config.js           # dev proxy /api -> server
│  ├─ index.html
│  ├─ tailwind.config.js       # industrial palette, fonts
│  └─ src/
│     ├─ main.jsx
│     ├─ App.jsx               # router + route guards
│     ├─ index.css             # tailwind + theme tokens
│     ├─ api/
│     │  └─ client.js          # axios instance + 401 handling
│     ├─ context/
│     │  └─ AuthContext.jsx    # user, login(), logout(), session restore
│     ├─ components/
│     │  ├─ ProtectedRoute.jsx # role-aware guard
│     │  ├─ Layout.jsx         # navbar/sidebar shell
│     │  ├─ GearScene.jsx      # 3D gears (lazy-loaded)
│     │  ├─ StatusBadge.jsx
│     │  ├─ Modal.jsx
│     │  └─ CredentialsModal.jsx  # shows ID/password + copy button
│     └─ pages/
│        ├─ Login.jsx                  # 3D hero + login form
│        ├─ admin/
│        │  ├─ Companies.jsx           # list + "Add company"
│        │  ├─ CompanyDetail.jsx       # members + projects of a company
│        │  └─ ProjectDetail.jsx       # parts CRUD table
│        └─ customer/
│           ├─ MyProjects.jsx          # project cards
│           └─ MyProjectDetail.jsx     # read-only parts + status
└─ server/
   ├─ package.json
   ├─ .env.example             # MONGO_URI, JWT_SECRET, JWT_EXPIRES, CLIENT_ORIGIN, ADMIN_*
   └─ src/
      ├─ index.js              # connect DB, start server
      ├─ app.js                # express setup, middleware, route mounting
      ├─ config.js             # env loading/validation
      ├─ models/
      │  ├─ User.js
      │  ├─ Company.js
      │  ├─ Project.js
      │  └─ Part.js
      ├─ routes/
      │  ├─ auth.routes.js
      │  ├─ admin.routes.js    # all /api/admin/* (requireRole admin)
      │  └─ customer.routes.js # all /api/me/*   (requireRole customer)
      ├─ controllers/
      │  ├─ auth.controller.js
      │  ├─ company.controller.js   # companies + members
      │  ├─ project.controller.js   # admin + customer project reads
      │  └─ part.controller.js
      ├─ middleware/
      │  ├─ auth.js            # verifyToken, requireRole
      │  ├─ validate.js        # zod wrapper
      │  └─ error.js           # central error handler + 404
      ├─ utils/
      │  ├─ credentials.js     # loginId + password generation
      │  └─ asyncHandler.js
      └─ scripts/
         └─ seedAdmin.js       # creates the single admin from env
```

Scaling note: layering is routes → controllers → models. If logic grows, a `services/` folder can be added per feature without moving anything else. Not created now (YAGNI).

---

## 4. High-Level Design

```
Browser (React SPA)
   │  HTTPS, JSON, httpOnly JWT cookie
   ▼
Express API ── middleware: helmet → cors → json → cookie → rate-limit(login)
   │            → verifyToken → requireRole → zod validate → controller
   ▼
MongoDB  (users, companies, projects, parts)
```

**Roles and boundaries**

- `admin`: full CRUD on everything under `/api/admin/*`.
- `customer`: only `GET /api/me/*`. Never trusted to send a `companyId`; it always comes from the verified JWT/DB user.
- Single admin is enforced by the seed script plus the API having no endpoint that can create an admin.

**Tenant isolation (the key security rule):** every customer query is filtered by `companyId = req.user.companyId`. Fetching a project/part of another company returns **404** (not 403), so existence isn't leaked.

---

## 5. Low-Level Design

### 5.1 Data Models

**Company**
| Field | Type | Notes |
|---|---|---|
| name | String, required, unique | |
| code | String, unique, uppercase | short slug used in login IDs, e.g. `ACME` |
| isActive | Boolean, default true | disabling a company blocks all its users |
| timestamps | | |

**User**
| Field | Type | Notes |
|---|---|---|
| name | String | |
| loginId | String, unique, lowercase | e.g. `acme-01` |
| passwordHash | String | bcrypt (cost 10); `select: false` |
| role | `admin` \| `customer` | |
| companyId | ObjectId → Company | required if customer, null for admin; indexed |
| isActive | Boolean, default true | |
| timestamps | | |

**Project**
| Field | Type | Notes |
|---|---|---|
| companyId | ObjectId → Company, indexed | |
| projectNo | String, required | unique **per company** (compound unique index `companyId+projectNo`) |
| title | String, optional | |
| timestamps | | |

**Part**
| Field | Type | Notes |
|---|---|---|
| projectId | ObjectId → Project, indexed | |
| companyId | ObjectId → Company, indexed | denormalised so customer part queries filter directly and safely |
| partNo | String, required | unique per project (compound index) |
| quantity | Number, int ≥ 1 | |
| status | enum | see below |
| timestamps | | `updatedAt` shown as "last updated" |

**Part status enum:** `QUEUED` → `IN_PRODUCTION` → `QUALITY_CHECK` → `COMPLETED` → `DISPATCHED` (+ `ON_HOLD`). Defined once in the server model and mirrored as a constant in the client (`StatusBadge.jsx`) with colour per status.

### 5.2 Credential Generation (`utils/credentials.js`)

- **loginId** = `<company.code lowercase>-<NN>` where NN is the next zero-padded member number for that company (count + 1, retry on duplicate-key error). Readable and unique.
- **password** = 10 chars, `crypto.randomInt`-based from an unambiguous alphabet (no `0/O/1/l`).
- Plaintext password is returned **once** in the create response and never stored. Only the bcrypt hash is saved.
- Admin can "Reset password" for a member → new password generated and shown once (covers forgotten passwords without OTP/email).

### 5.3 Auth Flow

1. `POST /api/auth/login {loginId, password}` → find active user (and active company if customer), `bcrypt.compare`.
2. Sign JWT `{sub: userId, role, companyId}`, expiry 8h (env-configurable).
3. Set as **httpOnly, sameSite=lax, secure(in prod)** cookie; also return `{user}` in body.
4. Every request: `verifyToken` reads cookie → loads `req.user` → `requireRole(...)`.
5. App start: client calls `GET /api/auth/me` to restore session; 401 → redirect to login.
6. `POST /api/auth/logout` clears cookie.
7. Generic "Invalid credentials" message for any failure; login endpoint rate-limited (e.g. 10/15 min per IP).

Single access token, no refresh tokens: simple and adequate for this scale.

### 5.4 API Specification

All JSON. Errors: `{ message, errors? }` with proper status codes.

**Auth**
| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | public | login |
| GET | `/api/auth/me` | any logged-in | current user |
| POST | `/api/auth/logout` | any | clear cookie |

**Admin — companies & members** (`requireRole('admin')`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/companies` | list (with member/project counts) |
| POST | `/api/admin/companies` | body `{name, code, member:{name}}` — **creates company + first member (mandatory)**; returns `{company, credentials:{loginId,password}}` |
| GET | `/api/admin/companies/:id` | company with members |
| PATCH | `/api/admin/companies/:id` | rename / activate-deactivate |
| POST | `/api/admin/companies/:id/members` | body `{name}` — add member; returns credentials once |
| PATCH | `/api/admin/users/:id` | edit name / activate-deactivate |
| POST | `/api/admin/users/:id/reset-password` | returns new credentials once |

Company creation without a member is impossible: the body schema requires `member`. Company + user are created in sequence; if user creation fails, the company is removed (avoids needing replica-set transactions).

**Admin — projects & parts**
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/companies/:id/projects` | projects of a company |
| POST | `/api/admin/companies/:id/projects` | `{projectNo, title?}` |
| PATCH | `/api/admin/projects/:id` | edit |
| DELETE | `/api/admin/projects/:id` | delete project and its parts |
| GET | `/api/admin/projects/:id/parts` | parts list |
| POST | `/api/admin/projects/:id/parts` | `{partNo, quantity, status?}` (companyId copied from project) |
| PATCH | `/api/admin/parts/:id` | edit partNo/quantity/status (status change is the common case) |
| DELETE | `/api/admin/parts/:id` | delete |

**Customer** (`requireRole('customer')`, always scoped by token's `companyId`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/me/projects` | own company's projects (with part count + progress summary) |
| GET | `/api/me/projects/:id` | project + its parts (404 if not own company) |

Customers have no write endpoints at all.

### 5.5 Validation & Errors
- zod schemas live next to each controller; `validate(schema)` middleware parses `body`/`params`.
- Duplicate-key errors (code 11000) mapped to 409 with friendly text ("Project no. already exists").
- Invalid ObjectId → 400; not found → 404; central error handler returns uniform shape and hides stack traces in production.

---

## 6. Frontend Design

### 6.1 Routes
| Path | Guard | Page |
|---|---|---|
| `/login` | public (redirect if logged in) | Login |
| `/admin` | admin | Companies |
| `/admin/companies/:id` | admin | CompanyDetail (members tab, projects tab) |
| `/admin/projects/:id` | admin | ProjectDetail (parts table, inline status edit) |
| `/app` | customer | MyProjects |
| `/app/projects/:id` | customer | MyProjectDetail |
| `*` | – | redirect by role |

`ProtectedRoute` takes `role`; wrong role redirects to its own home.

### 6.2 Key Flows

**A. Admin onboards a company**
Companies page → "Add company" modal (company name, code, first member name) → submit → `CredentialsModal` shows Login ID + Password with **Copy** buttons and a "shown only once" warning → admin shares them with the client.

**B. Admin adds a member to existing company**
CompanyDetail → Members tab → "Add member" → same CredentialsModal. Also per-member "Reset password" and enable/disable toggle.

**C. Admin manages work**
CompanyDetail → Projects tab → add project no. → open project → parts table (part no., qty, status dropdown). Add/edit/delete via modal; status change saves inline with optimistic UI.

**D. Customer views status**
Login → MyProjects (cards with project no., parts count, animated progress ring) → project detail → read-only table of part no., quantity, status badge, last updated. Status filter chips and search by part no.

### 6.3 Look & Feel ("mechanical industry")

- **Palette:** dark steel greys (#0f1317 / #1b2128), brushed-metal gradients, safety-orange accent (#ff6a00), subtle machine-green for "Completed". Light/dark not toggled — one strong dark theme keeps scope small.
- **Typography:** condensed industrial display font (e.g. Barlow Condensed) for headings, Inter for body; monospace for part/project numbers.
- **Visual motifs:** hex-bolt/rivet corner details, grid "blueprint" background lines, hazard-stripe dividers used sparingly.
- **3D:** `GearScene.jsx` — interlocking procedurally generated gears (extruded gear shapes in three.js) slowly rotating, with mouse-parallax tilt; used as the Login hero and a small version in the dashboard header. Lazy-loaded (`React.lazy`) so it never blocks first paint; falls back to a CSS static graphic on low-power devices / `prefers-reduced-motion`.
- **Animations (framer-motion):** page transitions, staggered card/table-row entry, status badge colour morph on change, animated progress rings, modal spring-in, button press feedback.
- **Responsive:** mobile-first Tailwind. Tables collapse into stacked cards under `md`; admin nav becomes a bottom/hamburger menu; 3D scene scaled down or hidden on small screens; touch targets ≥ 44px.
- **Intuitive UX:** one primary action per screen, empty states with guidance, toasts for success/error, confirm dialogs for deletes, loading skeletons.

---

## 7. Security Checklist
- Passwords hashed (bcrypt); plaintext shown once only; never logged.
- JWT in httpOnly cookie (no XSS token theft); CORS limited to `CLIENT_ORIGIN` with credentials; sameSite lax.
- Role middleware on every route group; tenant filter on every customer query.
- Deactivated user/company is rejected at `verifyToken` (checked against DB each request, so disabling takes effect immediately).
- Login rate limiting, helmet headers, body size limit, zod validation, mongo-sanitisation by strict schema typing (reject object-valued strings).
- Secrets only via `.env`; `.env.example` committed, `.env` ignored.

---

## 8. Build Order (milestones)

1. **Scaffold:** root workspaces, server + client skeleton, env config, Mongo connection, health route.
2. **Auth:** User model, seed admin script, login/me/logout, middleware, client AuthContext + Login page (plain).
3. **Companies & members:** models, credential util, admin endpoints, Companies/CompanyDetail pages, CredentialsModal.
4. **Projects & parts:** models, admin endpoints, ProjectDetail page.
5. **Customer views:** `/api/me/*`, MyProjects/MyProjectDetail.
6. **UI polish:** theme, GearScene 3D, animations, responsive pass, empty/loading/error states.
7. **Hardening & docs:** rate limit, error mapping, README with setup and deploy notes.

Deploy suggestion (later): MongoDB Atlas, API on Render/Railway/VPS, client static build served via same host or Netlify/Vercel with API URL env.

---

## 9. Verification (end-to-end)

1. `npm install` at root; copy `server/.env.example` → `.env`; `npm run seed` creates admin; `npm run dev` starts both.
2. Login as admin → create company "Acme" with first member → copy credentials from modal.
3. Add second member; confirm loginId increments (`acme-02`).
4. Create project `P-1001` and parts with quantities/statuses; change a status inline.
5. Create a second company with its own project/parts.
6. Log in (private window) as Acme member → sees only Acme projects, read-only.
7. **Isolation test:** as Acme user, call `GET /api/me/projects/<other-company-project-id>` → 404; call any `/api/admin/*` → 403; try `PATCH` on a part → 403.
8. Deactivate a member → their next request returns 401; reset password → old password fails, new works.
9. Duplicate project no. in same company → 409; same project no. in a different company → allowed.
10. Responsive check at 375px, 768px, 1280px; verify 3D scene lazy-loads and respects reduced-motion.
11. Optional lightweight API tests (`vitest` + `supertest`) for auth, role guard, and tenant isolation — the three rules that must never regress.

---

## 10. Assumptions to confirm
- Login ID auto-format `<companycode>-NN`; password 10 random chars (admin can reset anytime).
- Part statuses as listed in 5.1 (easily changed: one enum).
- Customers are strictly read-only; no file/drawing uploads, notifications, or export in v1.
- Single dark industrial theme (no light mode toggle) in v1.
