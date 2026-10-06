# AssignMe Phase 1 — AI + Research Architecture (PRD §§4, 7–16)

## Request composition (§12)

Every AI call builds context in order:
`System rules + Ethics rules + Discipline Pack + Work-Type Template +
Academic Profile + Workspace Context + Institutional Requirements +
Evidence Pool + Current Task`.

No call without workspace scope except profile/structure helpers.

## Pipeline

`Validate → Load context → Research if required → Generate (Gemini native
generateContent + x-goog-api-key, model from GEMINI_MODEL) → Clean →
Validate citations → Review → Save (AIRequest/AIResponse) → Display`.

- Modes: BUILD_WITH_ME pauses at academic decisions for approve/reject/modify;
  AUTOMATIC proceeds on routine steps but stops on missing info, conflict,
  major assumption, unverifiable evidence, unsupported conclusion, safety/privacy (§11).
- Response record: `{ status, answer, rationale, sources, citations, warnings,
  nextStep, reviewIssues }`. Status: DRAFT | VERIFIED | NEEDS_REVIEW | BLOCKED | ERROR.
  Chain-of-thought never stored or shown (§13).

## Research engine (§7)

Providers: Crossref + OpenAlex only at launch.
Flow: need → terms → search → date/relevance filter → dedupe → metadata verify →
evidence-pool insert → generation use → post-gen citation validation.
Source fields: title, authors, year, publication, DOI, URL, abstract, type,
verification status, retrieval date.
Rules: strict rolling 5-year window (~2021–2026); older only if explicitly
requested + visibly flagged. Never invent sources/authors/journals/DOIs/years/stats.

## Cleaning (§14)

Strip dupe headings/paragraphs, malformed formatting, raw JSON, placeholders,
TODO/Lorem, broken citations, dupe refs. Preserve quotes. Flag unsupported claims.
Never invent missing info, never silently change student meaning.

## Reviewer + consistency (§§15–16)

Reviewer dimensions: relevance, structure, argument, logic, evidence, source quality,
citation consistency, scope, clarity, repetition, unsupported claims, objective/RQ
alignment, method consistency. Severity: CRITICAL | MAJOR | MODERATE | MINOR | SUGGESTION.
Evidence-based language, no false certainty.
Consistency checks: topic/objective/RQ, sample/population/method drift,
missing objectives in results, conclusions without findings, citation/reference mismatch.
