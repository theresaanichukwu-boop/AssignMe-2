// Professor-style reviewer (PRD §15): deterministic checks across review
// dimensions, classified by severity, in evidence-based language.

import { WORK_TYPES, type WorkTypeKey } from "@/lib/academic/work-types";

export type Severity = "CRITICAL" | "MAJOR" | "MODERATE" | "MINOR" | "SUGGESTION";

export interface ReviewIssue {
  severity: Severity;
  dimension: string;
  message: string;
}

export interface ReviewInput {
  content: string;
  topic: string;
  objectives: string[];
  researchQuestions: string[];
  evidenceCount: number;
  citationStyle: string;
}

const CITATION_RE = /(\([^)]*\d{4}[^)]*\)|\[\d+\])/g;

function words(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3);
}

export function reviewContent(input: ReviewInput): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  const text = input.content.trim();

  if (text.length === 0) {
    return [{ severity: "MAJOR", dimension: "Scope", message: "The section is empty — nothing to review yet." }];
  }

  // Evidence & unsupported claims.
  const citations = text.match(CITATION_RE) ?? [];
  const certainty = text.match(/\b(proves?|definitively|conclusively|always|never|all studies show)\b/gi) ?? [];
  if (certainty.length > 0 && citations.length === 0) {
    issues.push({
      severity: "CRITICAL",
      dimension: "Evidence",
      message: `Uses conclusive language (${certainty.length} instance(s)) with no citations. Soften the claims or add verified evidence.`,
    });
  } else if (input.evidenceCount === 0 && text.length > 500) {
    issues.push({
      severity: "MAJOR",
      dimension: "Evidence",
      message: "No verified evidence in the pool supports this section. Research before relying on it.",
    });
  }

  // Repetition.
  const paras = text.split(/\n{2,}|\r?\n/).map((p) => p.trim()).filter(Boolean);
  if (paras.length >= 2) {
    const seen = new Set<string>();
    let dupes = 0;
    for (const p of paras) {
      const key = p.toLowerCase().slice(0, 120);
      if (seen.has(key)) dupes++;
      seen.add(key);
    }
    if (dupes > 0) {
      issues.push({ severity: "MODERATE", dimension: "Repetition", message: `${dupes} paragraph(s) repeat earlier material. Consolidate or remove.` });
    }
  }

  // Objective / research-question alignment (keyword overlap heuristic).
  const contentWords = new Set(words(text));
  for (const objective of input.objectives) {
    const ow = words(objective).filter((w) => !contentWords.has(w));
    if (ow.length > 0 && ow.length / Math.max(1, words(objective).length) > 0.7) {
      issues.push({
        severity: "MAJOR",
        dimension: "Objective alignment",
        message: `Objective “${objective.slice(0, 80)}…” shares little vocabulary with this section. Check coverage.`,
      });
    }
  }

  // Topic relevance.
  const topicWords = words(input.topic);
  if (topicWords.length > 0) {
    const overlap = topicWords.filter((w) => contentWords.has(w)).length;
    if (overlap / topicWords.length < 0.3) {
      issues.push({
        severity: "MODERATE",
        dimension: "Relevance",
        message: "The section shares little vocabulary with the stated topic. Confirm it stays in scope.",
      });
    }
  }

  // Structure & clarity heuristics.
  if (text.length < 300) {
    issues.push({ severity: "MINOR", dimension: "Scope", message: "Section is very short — consider whether it fully develops its point." });
  }
  const longSentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.split(/\s+/).length > 45);
  if (longSentences.length > 0) {
    issues.push({ severity: "MINOR", dimension: "Clarity", message: `${longSentences.length} sentence(s) exceed ~45 words. Consider splitting for readability.` });
  }

  // Citation consistency.
  if (citations.length > 0 && input.citationStyle === "UNKNOWN") {
    issues.push({ severity: "SUGGESTION", dimension: "Citation consistency", message: "Set a citation style in the academic profile for consistent formatting." });
  }

  if (issues.length === 0) {
    issues.push({ severity: "SUGGESTION", dimension: "Argument", message: "No structural problems detected. Strengthen the argument with counter-evidence where appropriate." });
  }
  return issues;
}

/**
 * Work-type structure check (spec §10): required section families for the
 * work type must exist — never the same bar for every work type.
 */
export function reviewStructure(workType: WorkTypeKey, sections: Array<{ key: string; title: string }>): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  if (sections.length === 0) {
    return [{ severity: "MAJOR", dimension: "Structure", message: "No sections exist yet. Build the work-type structure first." }];
  }
  const haystack = sections.map((s) => `${s.key} ${s.title}`.toLowerCase()).join(" | ");
  const missing: string[] = [];
  for (const family of WORK_TYPES[workType].expectedSections) {
    const present = family.some((kw) => haystack.includes(kw));
    if (!present) missing.push(family[0]);
  }
  if (missing.length > 0) {
    issues.push({
      severity: workType === "RESEARCH_PROJECT" ? "MAJOR" : "MODERATE",
      dimension: "Structure",
      message: `Expected ${workType.replace(/_/g, " ").toLowerCase()} coverage is missing: ${missing.join(", ")}. Add or rename sections to cover it.`,
    });
  }
  return issues;
}
