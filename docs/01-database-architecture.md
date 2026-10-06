# AssignMe Phase 1 — Database Architecture (PRD §28)

Source of truth: PRD Master §§28, 35. Locked stack: PostgreSQL + Prisma 7.

## Principles

- One Prisma schema in `prisma/schema.prisma`, migrations only via `prisma migrate`.
- Production applies with `prisma migrate deploy`. Never `db push` in prod.
- Strict TypeScript, no `any`. Relations typed via Prisma Client.
- Every student-owned row carries ownership (`userId` directly or via `workspace.userId`).
  Every query filters by owner. No global listing without scope.
- Better Auth tables (`User`, `Session`, `Account`, `Verification`) must match the
  installed `better-auth@1.7.7` schema. Verify with Better Auth docs for that
  version before first migration; adjust minimal fields only.

## Entity groups

1. **Identity/Auth** — `User`, `Session`, `Account`, `Verification`
   Better Auth owned. `User.role`: STUDENT | ADMIN | CONTENT_MANAGER | SUPPORT.
2. **Academic profile** — `StudentProfile` (1:1 User), `Institution`, `Programme`,
   `Discipline`, `DisciplinePack` (1:1 Discipline, JSON config), `WorkTypeTemplate`
   (key: SEMINAR | RESEARCH_PROJECT | LITERATURE_REVIEW | CASE_STUDY | ESSAY | ASSIGNMENT).
3. **Workspace core** — `Workspace` (owner User), `WorkspaceRequirement` (uploaded
   brief/rubric/guidelines → R2 FileObject link), `Section` (ordered),
   `SectionVersion` (immutable snapshots), `Note`.
4. **Evidence** — `Source` (global dedupe by DOI/URL norm), `WorkspaceSource`
   (workspace ↔ source join + verification status), `EvidenceItem`
   (source + objective/question + finding + type + relevance + limitations + citation + notes),
   `Citation` (deterministic formatted string + style + mapping).
5. **AI** — `AIRequest` (task + context hash + mode BUILD_WITH_ME | AUTOMATIC),
   `AIResponse` (status DRAFT | VERIFIED | NEEDS_REVIEW | BLOCKED | ERROR + answer +
   rationale + warnings + nextStep, no chain-of-thought).
6. **Quality** — `Review` (per section or workspace), `ReviewIssue`
   (severity CRITICAL | MAJOR | MODERATE | MINOR | SUGGESTION + dimension + evidence).
7. **Business** — `Plan`, `Subscription`, `Trial`, `PaymentTransaction`
   (Paystack reference unique, server-verified), `UsageEvent` (metered actions),
   `FileObject` (R2 key, private), `SupportTicket`, `UserReport`, `AuditLog`,
   `FeatureConfiguration` (usage limits), `Notification`.

## Key constraints / indexes

- `Workspace(userId, createdAt)`, `Section(workspaceId, order)` unique order per workspace.
- `SectionVersion(sectionId, version)` unique, immutable.
- `Source.doi` unique where not null; `Source.normalizedUrl` unique index.
- `WorkspaceSource(workspaceId, sourceId)` unique.
- `PaymentTransaction.paystackReference` unique.
- `UsageEvent(userId, type, createdAt)` index for quota checks (Redis gate + DB ledger).
- `AuditLog(userId, action, createdAt)` append-only (no update/delete API).
- Full-text index on `Source.title`, `EvidenceItem.keyFinding` (Postgres GIN/trigram, Phase 3).

## Migration plan

1. `prisma/schema.prisma` committed in Phase 1 (this phase).
2. `prisma/migrations/` created via Docker Postgres + `prisma migrate dev --name init`.
3. CI runs `prisma generate → next typegen → tsc`.
4. Seeds: `prisma/seed.ts` loads 6 WorkTypeTemplates + DisciplinePack stubs (Phase 3).
