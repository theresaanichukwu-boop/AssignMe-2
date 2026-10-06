// Consistency checking (PRD §16): contradictions across workspace parts.

export interface ConsistencyIssue {
  code:
    | "TOPIC_OBJECTIVE_MISMATCH"
    | "OBJECTIVE_QUESTION_MISMATCH"
    | "METHODOLOGY_DRIFT"
    | "MISSING_OBJECTIVE_IN_RESULTS"
    | "CONCLUSION_WITHOUT_FINDINGS"
    | "CITATION_REFERENCE_MISMATCH";
  message: string;
}

export interface WorkspaceSnapshot {
  topic: string;
  objectives: string[];
  researchQuestions: string[];
  sections: Array<{ key: string; title: string; content: string }>;
  citationCount: number;
  referenceCount: number;
}

function tokenSet(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3)
  );
}

function overlap(a: string, b: string): number {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (A.size === 0 || B.size === 0) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared / Math.max(A.size, B.size);
}

const METHOD_RE = /\b(quantitative|qualitative|mixed methods|survey|interview|experiment|case study|ethnograph)\b/gi;

export function checkConsistency(ws: WorkspaceSnapshot): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  for (const o of ws.objectives) {
    if (overlap(ws.topic, o) < 0.15) {
      issues.push({
        code: "TOPIC_OBJECTIVE_MISMATCH",
        message: `Objective “${o.slice(0, 80)}…” shows low overlap with the topic. Realign or reword.`,
      });
    }
  }

  for (const q of ws.researchQuestions) {
    const best = Math.max(0, ...ws.objectives.map((o) => overlap(q, o)));
    if (ws.objectives.length > 0 && best < 0.15) {
      issues.push({
        code: "OBJECTIVE_QUESTION_MISMATCH",
        message: `Research question “${q.slice(0, 80)}…” does not clearly map to any objective.`,
      });
    }
  }

  const methods = new Set<string>();
  for (const s of ws.sections) {
    for (const m of s.content.match(METHOD_RE) ?? []) methods.add(m.toLowerCase());
  }
  if (methods.size > 2) {
    issues.push({
      code: "METHODOLOGY_DRIFT",
      message: `Multiple methodologies mentioned (${[...methods].join(", ")}). Confirm the design is intentional.`,
    });
  }

  const results = ws.sections.find((s) => /result|finding/i.test(s.key + " " + s.title));
  if (results && ws.objectives.length > 0) {
    const uncovered = ws.objectives.filter((o) => overlap(results.content, o) < 0.1);
    if (uncovered.length > 0) {
      issues.push({
        code: "MISSING_OBJECTIVE_IN_RESULTS",
        message: `${uncovered.length} objective(s) have little presence in Results. Check coverage.`,
      });
    }
  }

  const conclusion = ws.sections.find((s) => /conclusion|discussion/i.test(s.key + " " + s.title));
  if (conclusion && !results && ws.sections.length > 2) {
    issues.push({
      code: "CONCLUSION_WITHOUT_FINDINGS",
      message: "A conclusion exists but no Results/Findings section was found. Conclusions must follow findings.",
    });
  }

  if (ws.citationCount !== ws.referenceCount) {
    issues.push({
      code: "CITATION_REFERENCE_MISMATCH",
      message: `${ws.citationCount} in-text citation(s) vs ${ws.referenceCount} reference(s). Every citation needs a matching reference.`,
    });
  }

  return issues;
}
