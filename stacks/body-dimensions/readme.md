## Product scope

### Core measurements (MVP)

Track entries over time for:

* **Height** (cm)
* **Body weight** (kg)
* **Body fat %** (percent)
* **Skinfold / body fat mm** (mm) — support multiple sites (e.g., abdomen, thigh)

### Key user flows

* Add a measurement entry (single date, many fields)
* View history as list + simple charts
* Edit/delete an entry
* “Latest stats” overview
* Optional: import/export CSV (nice-to-have)

---

## Data model (Postgres)

### Entities

**users**

* `id` (uuid, pk)
* `email` (text, unique)
* `password_hash` (text) *(if doing local auth)*
* `created_at`, `updated_at`

**measurement_entries**

* `id` (uuid, pk)
* `user_id` (uuid, fk -> users.id)
* `measured_at` (timestamptz, default now) *(the date of measurement)*
* `height_cm` (numeric(5,2), nullable)
* `weight_kg` (numeric(6,2), nullable)
* `body_fat_percent` (numeric(5,2), nullable)
* `notes` (text, nullable)
* `created_at`, `updated_at`
* indexes: `(user_id, measured_at desc)`

**skinfold_measurements**

* `id` (uuid, pk)
* `entry_id` (uuid, fk -> measurement_entries.id on delete cascade)
* `site` (text) *(enum-like: abdomen, thigh, chest, suprailiac, etc.)*
* `mm` (numeric(5,2))
* unique constraint: `(entry_id, site)`

**Optional** (if you want calculated BF from skinfolds later):

* `calculation_method` on entry (text) + store derived values separately

### Constraints / validation

* Height: 50–300 cm
* Weight: 20–500 kg
* BF%: 1–75
* Skinfold mm: 0–100 (or 0–150 depending on calipers)

---

## API stack (Koa + TS)

### Tech choices

* Koa, koa-router
* zod (request validation)
* postgres driver: `pg` + query builder (Kysely) or Prisma
* auth: JWT (access token) + refresh token OR session cookies

### API endpoints (MVP)

**Auth**

* `POST /auth/register`
* `POST /auth/login`
* `POST /auth/logout`
* `GET /me` (current user)

**Measurements**

* `GET /entries?from=...&to=...&limit=...`
* `GET /entries/latest`
* `POST /entries`
* `PATCH /entries/:id`
* `DELETE /entries/:id`

**SkinfoId**

* included in entry payload, or separate:

  * `PUT /entries/:id/skinfolds` (replace set)
  * `PATCH /entries/:id/skinfolds` (partial)

### Request/response shapes

**POST /entries**

```json
{
  "measuredAt": "2026-01-02T08:00:00.000Z",
  "heightCm": 190.5,
  "weightKg": 108.0,
  "bodyFatPercent": 16.3,
  "skinfolds": [
    { "site": "abdomen", "mm": 29 },
    { "site": "thigh", "mm": 25 }
  ],
  "notes": "Fasted AM"
}
```

**GET /entries/latest**

```json
{
  "entry": { "...": "..." },
  "trends": {
    "weightKg": { "delta7d": -0.8, "delta30d": -1.9 },
    "bodyFatPercent": { "delta30d": -0.6 }
  }
}
```

### Non-functional requirements

* All endpoints scoped to authenticated `user_id`
* Rate limit auth endpoints
* Centralized error handling (400 validation, 401 auth, 404, 500)
* OpenAPI spec output (optional but valuable)

---

## Web stack (SolidJS + Vite)

### Pages

* **Login/Register**
* **Dashboard**

  * latest height/weight/BF%
  * “last measured” date
  * quick add button
* **Add/Edit Entry**

  * date/time
  * height/weight/BF%
  * skinfold rows (site dropdown + mm)
* **History**

  * table view (sortable)
  * charts for weight and BF% (optional MVP+)
* **Settings**

  * units (kg/lb toggle later, cm/in later)
  * export CSV (optional)

### UI components

* Measurement card (latest values)
* Entry form (with validation + inline errors)
* Skinfold list editor (add/remove row)
* History table
* Basic chart component (MVP+: uPlot / Chart.js / ECharts)

---

## Repo structure (TurboRepo monorepo)

```
repo/
  apps/
    api/          # koa node typescript API backend (stack)
    web/          # solidjs vite frontend (stack)
  stacks/
    db/           # postgres schema + migrations (stack)
  packages/
    shared/       # shared types (zod schemas, TS types)
    eslint-config/
    tsconfig/
  turbo.json
  package.json
```

### Why “stacks/” for DB?

Because it’s deployed as infrastructure and referenced by the deploy system. Keeping it distinct avoids pretending it’s an “app”.

---

## DB stack (migrations + local dev)

### Contents

```
stacks/db/
  migrations/
  schema.sql (optional)
  docker-compose.yml (dev only)
  README.md
```

### Migrations

Pick one:

* `node-pg-migrate`
* `drizzle-kit`
* `prisma migrate`

If you want the cleanest API+db coupling, **Drizzle** or **Prisma** is easiest. If you want minimal dependencies, `node-pg-migrate` is great.

---

## “Stack” contract for deploy integration

Each stack should expose:

* how it builds
* how it runs
* env vars it needs
* health checks

### Example env vars

**api**

* `DATABASE_URL`
* `JWT_SECRET`
* `CORS_ORIGIN`
* `PORT`

**web**

* `VITE_API_URL`

**db**

* `POSTGRES_DB`
* `POSTGRES_USER`
* `POSTGRES_PASSWORD`

---

## TurboRepo scripts (root package.json)

Suggested scripts:

* `turbo dev` → runs web + api + db (db via compose)
* `turbo build` → builds api + web
* `turbo lint` / `turbo test`
* `turbo migrate` → runs db migrations
* `turbo typecheck`

`turbo.json` pipeline idea:

* `build` depends on `^build`
* `dev` is persistent
* `migrate` is not cached
* `lint/typecheck` cached

---

## Shared types package (recommended)

Put shared validation/types in `packages/shared`:

* `EntrySchema` (zod)
* `SkinfoldSchema`
* TS types inferred from zod
* used by both API and Web so you never drift

---

## MVP acceptance criteria

1. User can register/login
2. User can create an entry with any subset of:

   * height, weight, BF%, skinfolds
3. User can view history and latest entry
4. User can edit/delete an entry
5. Data persists in Postgres
6. Repo is TurboRepo with `api`, `web`, `db` stacks and one-command dev

---

## Good “next” features (post-MVP)

* Unit conversion (kg/lb, cm/in)
* Calculated BF% from skinfold method selection (Jackson-Pollock 3-site etc.)
* Photo upload per entry (progress pics)
* Reminders + streaks
* Trend lines + moving averages
* Export to CSV + Apple Health/Google Fit (later)

---

If you want, I can turn this into:

* a **README-level spec** (PRD + technical design),
* a **Jira epic with stories** (API, DB, Web),
* and a **concrete folder skeleton** (file tree + key config snippets) you can paste straight into your repo.
