# E2E journeys (PRD §38)

Live tests against a running server — they cover the critical user journeys
with real Postgres/Redis and (where configured) real providers:

| Suite | Journey |
|---|---|
| `01-core` | signup → workspace CRUD → sections → versions/restore → profile → cross-user isolation |
| `02-ai-research` | citations → generate guards → review → live Crossref/OpenAlex → evidence |
| `03-business` | trial hook → quotas → Paystack/R2 setup gates → webhook auth → DOCX export → support → admin gates |
| `04-ai-live` | Gemini draft → persist → save-to-section (consumes AI quota) |
| `05-storage` | B2 presigned upload → PUT → download → byte-identical (leaves a probe file) |
| `06-billing` | Paystack initialize → checkout URL → unpaid verify fails closed (pending tx, no charge) |

Run:

```bash
docker compose up -d db redis
npx prisma migrate dev && node prisma/seed.ts
npx next dev -p 3100   # separate terminal
npm run test:e2e          # suites 01-03
npm run test:e2e -- 04    # single suite (04-06 touch live quotas/storage/billing)
npm run test:e2e -- all-live
```
