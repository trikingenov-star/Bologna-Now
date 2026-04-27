# Workspace — Bolo VIVA

## Overview

pnpm workspace monorepo using TypeScript. Main artifact is **Bolo VIVA** — a smart, personalized Bologna city guide.

## Bolo VIVA Features
- Survey-based personalization (travel style, interests, time preference)
- Survey interests aligned with Excel categories: Food & Wine, Art & Design, History & Culture, Outdoor, Sport, Aperitivi, Events & Music, Shopping, Out the city
- Profile-based dynamic filters in Explore (Today/Events/Art/Culture/Food/Outdoor/Sport/Locations/Aperitivi/Shopping/OutCity)
- Carousel activity discovery with swipe + arrow navigation
- 90+ curated Bologna activities from Excel data (115 rows across 9 categories)
  - Food & Wine: 14 restaurants incl. Sfoglia Rina, Grassilli, Biagi, Biassanot, Da Me, Casamerlò, Da Nello, Da Cesari, Nectare/Zem/Malerba (veg)
  - Art & Design: MAMbo, Via Piella, Palazzo D'Accursio, Cinema Modernissimo, Strada del Jazz, Palazzo Pepoli, Ghetto Ebraico, etc.
  - History & Culture: all major churches, piazze, palazzi with editorial local tips
  - Outdoor: portici, parchi, orto botanico, canale navile, arco meloncello, etc.
  - Sport: 8 options incl. Vettori, Sterlino, City Padel, Ciclovia del Sole
  - Aperitivi: 16 bars incl. Le Stanze, Camera con Vista, Terrazza Mattuiani, Piazza Aldrovandi
  - Shopping: 17 spots incl. Quadrilatero, Salumeria Simoni, Galleria Cavour, vintage boutiques
  - Out the city: Dozza, Ferrara, Castelguelfo Outlet, Autodromo Ferrari, Museo Ducati, Colli Bolognesi, Rimini
- Editorial descriptions & local tips from Excel — AI generation skipped for items with hardcoded content
- Photos from TripAdvisor CDN (per Excel) for restaurants; Unsplash fallback for others
- familyOnly / noFamily / coupleOnly filters based on travel style (from Excel PER TE column)
- vegetarian flag on Nectare, Zem Bistrot, Malerba
- AI-powered itinerary builder (gpt-5-mini via Replit AI integration)
- AI activity detail descriptions with local tips (for items without hardcoded content)
- Editorial/cultural storytelling section with 6 Bologna stories
- IT/EN language toggle (auto-translates entire app)
- Maps integration with Google Maps route generation
- Warm terracotta/cream Bologna design palette (#C1432A primary)
- User profile stored in localStorage (key: `bolo-user-profile-v3`)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
