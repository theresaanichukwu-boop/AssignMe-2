# Phase 6 — Quality & security record (PRD §§30, 38–39)

## Test pyramid

- Unit (vitest, 43 tests): design tokens, workspace/support/file validation,
  AI cleaning, deterministic citations, reviewer, consistency checks, research
  dedupe/provider-failure, pipeline guards + injection tagging, webhook HMAC,
  storage keys, quota mapping, DOCX build, rate-limit buckets.
- Integration: live suites in `scripts/e2e/` (01 core/authZ, 02 AI+research,
  03 business/quotas/export/support/admin gates, 04 AI live, 05 B2, 06 billing).
  Run via `npm run test:e2e` against DB + dev server (see `scripts/e2e/README.md`).
- Verified live: Gemini draft (DRAFT + persisted), Crossref/OpenAlex (in-window,
  saved VERIFIED), B2 upload/download byte-identical, Paystack init + fail-closed
  verify, DOCX download, trial auto-grant, quota + admin gates.

## Security controls (§30)

- Auth + role + ownership on every protected route; admin/support/content gates.
- Zod validation server-side on all input; webhook raw-body HMAC-SHA512 check.
- Redis fixed-window rate limits on generate/research/review/export/billing
  (`lib/security/rate-limit.ts`, fail-open with warning when Redis is down).
- Secure headers (HSTS, frame deny, nosniff, referrer, permissions) in `next.config.ts`.
- Secrets server-side only; no keys/passwords/cards in logs; append-only audit log.
- External research content tagged UNTRUSTED, never executed as instructions.

## Dependency audit (2026-10-08)

`npm audit`: 27 → 7 findings after upgrading `@aws-sdk/*` 3.928 → 3.1147.
Remaining 7 are dev/CLI-only (prisma CLI chain via mysql2/deepmerge-ts,
vitest/tinypool) with no production runtime path. Upgrading them would force
vitest 4 / prisma 8-rc, violating the locked stack (Prisma 7) — accepted risk,
revisit on stable releases.

## CI

`.github/workflows/ci.yml` runs the PRD §39 order on every push/PR:
`prisma generate → next typegen → tsc → eslint → vitest → next build`.
