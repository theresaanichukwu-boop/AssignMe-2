// Deterministic citation layer (PRD §9). Never rely on AI for formatting.

export type CitationStyle = "APA_7" | "MLA_9" | "CHICAGO" | "HARVARD" | "VANCOUVER" | "IEEE";

export interface CitableSource {
  title: string;
  authors: string[];
  year: number | null;
  publication: string | null;
  doi: string | null;
  url: string | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const given = parts.slice(0, -1).map((p) => `${p[0].toUpperCase()}.`).join(" ");
  return `${last}, ${given}`;
}

function apaAuthors(authors: string[]): string {
  if (authors.length === 0) return "";
  if (authors.length === 1) return initials(authors[0]);
  if (authors.length <= 20) {
    return authors.slice(0, -1).map(initials).join(", ") + ", & " + initials(authors[authors.length - 1]);
  }
  return authors.slice(0, 19).map(initials).join(", ") + ", … " + initials(authors[authors.length - 1]);
}

function mlaAuthors(authors: string[]): string {
  if (authors.length === 0) return "";
  if (authors.length === 1) {
    const p = authors[0].trim().split(/\s+/);
    return p.length === 1 ? p[0] : `${p[p.length - 1]}, ${p.slice(0, -1).join(" ")}`;
  }
  return `${mlaAuthors([authors[0]])}, et al`;
}

export function formatCitation(style: CitationStyle, s: CitableSource, index = 1): string {
  const year = s.year ?? "n.d.";
  const pub = s.publication ? ` ${s.publication}.` : "";
  const doi = s.doi ? ` https://doi.org/${s.doi}` : s.url ? ` ${s.url}` : "";
  switch (style) {
    case "APA_7":
      return `${apaAuthors(s.authors)} (${year}). ${s.title}.${pub}${doi}`.replace(/\s+/g, " ").trim();
    case "MLA_9":
      return `${mlaAuthors(s.authors)}. “${s.title}.”${s.publication ? ` ${s.publication},` : ""} ${year === "n.d." ? "" : `${year},`}${doi}`.replace(/\s+/g, " ").trim();
    case "CHICAGO":
      return `${s.authors.join(", ") || "Unknown"}. ${year}. “${s.title}.”${pub}${doi}`.replace(/\s+/g, " ").trim();
    case "HARVARD":
      return `${s.authors.join(", ") || "Unknown"} ${year}, '${s.title}',${pub}${doi}`.replace(/\s+/g, " ").trim();
    case "VANCOUVER":
      return `${index}. ${s.authors.join(", ") || "Unknown"}. ${s.title}.${pub} ${year};${doi}`.replace(/\s+/g, " ").trim();
    case "IEEE":
      return `[${index}] ${s.authors.map((a) => a.split(/\s+/).map((w, i, arr) => (i === arr.length - 1 ? w : `${w[0]}.`)).join(" ")).join(", ") || "Unknown"}, “${s.title},”${pub} ${year}.${doi}`.replace(/\s+/g, " ").trim();
  }
}

export interface CitationProblem {
  code: "MISSING_YEAR" | "MISSING_AUTHOR" | "MISSING_TITLE" | "OUT_OF_WINDOW" | "MISSING_LOCATOR";
  message: string;
}

/** Validate a source before citing (PRD §9 + 5-year window §7). */
export function validateCitable(s: CitableSource, minYear = 2021, maxYear = 2026): CitationProblem[] {
  const problems: CitationProblem[] = [];
  if (!s.title.trim()) problems.push({ code: "MISSING_TITLE", message: "Source has no title." });
  if (s.authors.length === 0) problems.push({ code: "MISSING_AUTHOR", message: "Source has no authors." });
  if (s.year === null) {
    problems.push({ code: "MISSING_YEAR", message: "Source has no publication year." });
  } else if (s.year < minYear || s.year > maxYear) {
    problems.push({
      code: "OUT_OF_WINDOW",
      message: `Year ${s.year} falls outside the ${minYear}–${maxYear} window. Flag explicitly if foundational.`,
    });
  }
  if (!s.doi && !s.url) {
    problems.push({ code: "MISSING_LOCATOR", message: "Source has neither DOI nor URL." });
  }
  return problems;
}
