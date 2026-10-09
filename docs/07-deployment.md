# Phase 7 — Deployment guide (PRD §40)

## Option A: Docker (any host)

```bash
docker compose up -d --build
```

The `web` image is multi-stage (pinned `node:22-alpine` digest), runs as
non-root, serves Next.js standalone output, and applies production migrations
(`prisma migrate deploy`) before starting. Health gating: web waits for healthy
PostgreSQL + Redis; all three services have healthchecks.

## Option B: Netlify + external PostgreSQL

1. Create a PostgreSQL database (Supabase, Neon, or similar). Use a pooled
   connection string if the provider offers one.
2. Connect the GitHub repo in Netlify. Build command and publish directory come
   from `netlify.toml` (`prisma generate && next typegen && next build`).
3. Set environment variables (Site settings → Environment variables). Full list
   in the `netlify.toml` comment: `DATABASE_URL`, `REDIS_URL` (Upstash or
   similar for production), `BETTER_AUTH_SECRET` (32+ chars),
   `GEMINI_API_KEY`, `GEMINI_MODEL`, `B2_*` (4 vars), `PAYSTACK_*` (2 vars),
   `RESEND_API_KEY`, `APP_URL` (the production URL — Paystack callback and
   auth links depend on it).
4. Deploy, then run once against the external database:
   `prisma migrate deploy`
5. Verify through the live application (checklist below), not only the build log.
   HTTPS is automatic on Netlify.

## Production verification checklist

- `GET /api/health` → 200 (also the Docker/Netlify health signal).
- Register → trial active → create workspace → draft section (Gemini).
- Research returns verified in-window sources; citations format; review runs.
- Billing page loads plans; Paystack checkout opens (test mode first).
- File upload issues a signed URL (B2 configured).
- `/admin/*` forbidden for students; audit log records admin actions.
