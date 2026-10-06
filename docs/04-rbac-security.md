# AssignMe Phase 1 — RBAC + Security Model (PRD §§27, 30–32)

## Roles

- STUDENT: own rows only (workspace, sections, sources, evidence, files, billing, tickets).
- ADMIN: full platform (users, subs/payments, disciplines, templates, AI config, reports, audit).
- CONTENT_MANAGER: templates + discipline packs + educational content only.
- SUPPORT: tickets + permitted account/payment lookups only. No academic content edit,
  no AI config, no audit purge.

Every server action: `auth → role → ownership`. `/api/admin/*` double-gates role + action.
Better Auth admin/organization plugins: verify required schema fields against
installed version, do not guess.

## Security controls (§30)

- Server-side authZ on all routes; input validated with Zod; rate limits (Redis).
- Secure cookies, secure headers (Next headers + Netlify), signed R2 URLs with
  type/size validation, safe object names, per-user prefix.
- Paystack: server-side verify, webhook HMAC check, idempotent apply.
- Secrets only server-side, via env (§36). Never log keys/passwords/cards/full docs.
- AuditLog append-only on auth, billing, admin, export, support assignment.
- Prompt-injection: system instructions never built from user/research/file content;
  external content tagged untrusted; AI tests cover injection (§38).

## Privacy / integrity (§§31–32)

- Fairness, accountability (reportable/traceable AI failures via Support + UserReport),
  transparency (show sources used), data minimization, no training-data reuse.
- Safe failures: preserve student content on AI/infra error; never fabricate on
  research failure; never report failed payment/upload as success.
- No marketing of guaranteed grades, plagiarism-free, detector evasion, undetectable writing.
  UI reminds student to check institutional AI policy.
