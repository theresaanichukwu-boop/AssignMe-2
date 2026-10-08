# ADR: File storage moved from Cloudflare R2 to Backblaze B2

Date: 2026-10-08
Status: Accepted (owner directive; supersedes PRD §§26/33 on storage)

## Decision

Private student files and workspace documents use **Backblaze B2** (S3-compatible API)
instead of Cloudflare R2. Implementation: `lib/storage/b2.ts` via
`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (no SDK change needed).

## Why compatible

All PRD §26 requirements still hold: private objects, signed access (10-minute
presigned PUT/GET), file type validation (PDF/DOCX/TXT/MD), 10MB size limits,
per-user key prefixes with sanitized names, ownership checks, safe parsing.

## Configuration

`B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET`, `B2_ENDPOINT`
(e.g. `https://s3.us-west-004.backblazeb2.com`; region parsed from the endpoint,
`B2_REGION` override supported). Without these, `/api/files` returns `503 SETUP`
and records nothing — never a false success.
