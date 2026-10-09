# AssignMe — AI-powered academic workspace

Plan, research, write, review, and export academic work with verified sources.
Behaves like an academic supervisor, not a generic chatbot.

## Quick start (local)

Prerequisites: Docker Desktop, Node 20–24.

```bash
cp .env.example .env   # fill provider keys as needed
docker compose up -d db redis
npx prisma migrate dev
node prisma/seed.ts
npm install
npm run dev            # http://localhost:3000
```

Seeded on first run: 6 work-type templates, 4 discipline packs, Free/Premium/Trial plans.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | development server |
| `npm run build` | `prisma generate && next typegen && next build` |
| `npm run typecheck` / `npm run lint` | `tsc --noEmit` / eslint |
| `npm run test` | vitest unit suite |
| `npm run test:e2e` | live journey suites 01–03 (`all-live` for 04–07, touch quotas/storage/billing) |
| `npm run db:seed` | seed templates, disciplines, plans |

## Production

```bash
docker compose up -d --build   # web runs `prisma migrate deploy`, then serves
```

Netlify: connect the repo, set environment variables (see `netlify.toml`
comment + `docs/07-deployment.md`), deploy, then run `prisma migrate deploy`
against the external PostgreSQL and verify through the live app.

## Docs

`docs/` holds the Phase 1 architecture decision records
(database, API contracts, AI/research, RBAC/security) plus storage (B2),
quality/security, and deployment guides. `design.html` previews the design system.
