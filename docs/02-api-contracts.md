# AssignMe Phase 1 — API Contracts (PRD §29)

All routes under `app/api/`. Auth: Better Auth session. Every protected handler:
`requireSession → requireRole → requireOwnership → validateInput(zod) → rateLimit → execute → audit`.

## Routes

| Route | Methods | Purpose |
|---|---|---|
| `/api/health` | GET | Public liveness, no secrets |
| `/api/profile` | GET, PUT | StudentProfile + academic fields (§3) |
| `/api/workspaces` | GET, POST | List (own only) / create |
| `/api/workspaces/[id]` | GET, PATCH, DELETE | Own workspace CRUD |
| `/api/workspaces/[id]/sections` | GET, POST, PATCH | Ordered sections, autosave target |
| `/api/workspaces/[id]/research` | POST, GET | Launch search (Crossref/OpenAlex), list jobs |
| `/api/workspaces/[id]/sources` | GET, POST, DELETE | WorkspaceSource join management |
| `/api/workspaces/[id]/evidence` | GET, POST, PATCH, DELETE | EvidenceItem CRUD |
| `/api/workspaces/[id]/generate` | POST | AI section draft (mode + task), returns AIResponse ref |
| `/api/workspaces/[id]/review` | POST, GET | Professor review + issues list |
| `/api/workspaces/[id]/versions` | GET, POST | SectionVersion snapshots / restore |
| `/api/workspaces/[id]/export` | POST, GET | Final-check + DOCX/PDF job + history |
| `/api/disciplines` | GET | List disciplines + packs (public meta) |
| `/api/work-types` | GET | List 6 templates (public meta) |
| `/api/citations` | POST | Format/validate a citation (deterministic layer) |
| `/api/files` | POST, GET, DELETE | B2 signed upload/download, type+size validated |
| `/api/billing` | GET, POST | Plans, initiate Paystack, subscription/trial status |
| `/api/billing/webhook` | POST | Paystack webhook, signature-verified, idempotent |
| `/api/support` | GET, POST, PATCH | Tickets + user reports (scoped) |
| `/api/admin/*` | * | ADMIN / CONTENT_MANAGER / SUPPORT gated per action |

## Envelope

Success: `{ ok: true, data, requestId }`.
Error: `{ ok: false, error: { code, message, issues?, requestId } }`.
Codes: UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, VALIDATION, CONFLICT,
RATE_LIMITED, UPSTREAM_ERROR, BLOCKED (academic/safety stop), INTERNAL.

## Validation / safety

- Zod schemas in `lib/validation/`, server-side only. No client-trusted payment status.
- Rate limits in Redis per user+route (generate/research/review/export stricter).
- Research upstream treated as untrusted data, never instructions (§30).
- Webhook: raw-body signature check before JSON parse, dedupe by Paystack reference.
