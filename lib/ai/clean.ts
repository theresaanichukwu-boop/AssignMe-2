// AI output cleaning (PRD §14). Deterministic, never invents.

export interface CleanResult {
  text: string;
  removed: string[];
  unsupportedClaims: string[];
}

const STRIP_PATTERNS: Array<{ test: RegExp; label: string }> = [
  { test: /^```json[\s\S]*?```$/gim, label: "raw JSON block" },
  { test: /\bTODO\b.*$/gim, label: "TODO placeholder" },
  { test: /lorem ipsum/gi, label: "lorem ipsum" },
  { test: /\[[^\]]*(TODO|TBD|XXX|placeholder)[^\]]*\]/gi, label: "unresolved placeholder" },
  { test: /\{\{\s*[^}]+\s*\}\}/g, label: "template placeholder" },
];

export function cleanOutput(input: string): CleanResult {
  const removed: string[] = [];
  let text = input;

  for (const { test, label } of STRIP_PATTERNS) {
    test.lastIndex = 0;
    if (test.test(text)) {
      removed.push(label);
      test.lastIndex = 0;
      text = text.replace(test, "").trim();
    }
  }

  // Collapse 3+ consecutive blank lines.
  text = text.replace(/\n{4,}/g, "\n\n\n");

  // Remove immediately repeated paragraphs (verbatim duplicates).
  const paras = text.split(/\n{2,}/);
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const p of paras) {
    const key = p.trim().toLowerCase();
    if (key && seen.has(key)) {
      if (!removed.includes("repeated paragraph")) removed.push("repeated paragraph");
      continue;
    }
    seen.add(key);
    kept.push(p);
  }
  text = kept.join("\n\n").trim();

  // Remove duplicate markdown headings (same text, back-to-back).
  const lines = text.split("\n");
  const deduped: string[] = [];
  for (const line of lines) {
    const prev = deduped[deduped.length - 1];
    if (/^#{1,6}\s+/.test(line) && prev === line) {
      if (!removed.includes("duplicate heading")) removed.push("duplicate heading");
      continue;
    }
    deduped.push(line);
  }
  text = deduped.join("\n").trim();

  // Flag sentences with certainty language but no citation marker.
  const unsupportedClaims: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  const certainty = /\b(proves?|definitively|conclusively|always|never|all studies show|it is proven)\b/i;
  const citation = /(\([^)]*\d{4}[^)]*\)|\[\d+\]|https?:\/\/|doi:)/i;
  for (const s of sentences) {
    if (certainty.test(s) && !citation.test(s)) unsupportedClaims.push(s.trim());
  }

  return { text, removed, unsupportedClaims };
}
