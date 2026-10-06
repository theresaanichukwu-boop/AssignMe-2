// Research providers — Crossref + OpenAlex only (PRD §7).
// External content is UNTRUSTED data: parsed as records, never instructions.

export interface RawSource {
  title: string;
  authors: string[];
  year: number | null;
  publication: string | null;
  doi: string | null;
  url: string | null;
  abstract: string | null;
  sourceType: string | null;
  provider: "crossref" | "openalex";
}

export const MIN_YEAR = 2021;
export const MAX_YEAR = 2026;

function normalizeDoi(doi: string | null | undefined): string | null {
  if (!doi) return null;
  const d = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").toLowerCase();
  return d || null;
}

function toYear(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d{4}$/.test(value.trim())) return Number(value.trim());
  return null;
}

interface CrossrefWork {
  title?: string[];
  author?: Array<{ given?: string; family?: string; name?: string }>;
  published?: { "date-parts"?: number[][] };
  "published-print"?: { "date-parts"?: number[][] };
  "published-online"?: { "date-parts"?: number[][] };
  "container-title"?: string[];
  DOI?: string;
  URL?: string;
  abstract?: string;
  type?: string;
}

function parseCrossref(w: CrossrefWork): RawSource | null {
  const title = w.title?.[0]?.trim();
  if (!title) return null;
  const year =
    toYear(w.published?.["date-parts"]?.[0]?.[0]) ??
    toYear(w["published-print"]?.["date-parts"]?.[0]?.[0]) ??
    toYear(w["published-online"]?.["date-parts"]?.[0]?.[0]);
  const authors = (w.author ?? []).map((a) =>
    a.name ?? [a.given, a.family].filter(Boolean).join(" ")
  ).filter(Boolean);
  return {
    title,
    authors,
    year,
    publication: w["container-title"]?.[0] ?? null,
    doi: normalizeDoi(w.DOI),
    url: w.URL ?? (w.DOI ? `https://doi.org/${normalizeDoi(w.DOI)}` : null),
    abstract: w.abstract ?? null,
    sourceType: w.type ?? null,
    provider: "crossref",
  };
}

export async function searchCrossref(query: string, limit = 10): Promise<RawSource[]> {
  const url =
    `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}` +
    `&filter=from-pub-date:${MIN_YEAR}-01-01,until-pub-date:${MAX_YEAR}-12-31&rows=${limit}&select=title,author,published,published-print,published-online,container-title,DOI,URL,abstract,type`;
  const res = await fetch(url, {
    headers: { "User-Agent": "AssignMe/1.0 (mailto:support@assignme.app)", Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Crossref error: ${res.status}`);
  const json = (await res.json()) as { message?: { items?: CrossrefWork[] } };
  return (json.message?.items ?? [])
    .map(parseCrossref)
    .filter((s): s is RawSource => s !== null);
}

interface OpenAlexWork {
  title?: string | null;
  publication_year?: number | null;
  authorships?: Array<{ author?: { display_name?: string } }>;
  primary_location?: { source?: { display_name?: string } } | null;
  doi?: string | null;
  id?: string;
  abstract_inverted_index?: Record<string, number[]> | null;
  type?: string;
}

function abstractFromIndex(index: Record<string, number[]> | null | undefined): string | null {
  if (!index) return null;
  const entries: Array<[string, number]> = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const p of positions) entries.push([word, p]);
  }
  entries.sort((a, b) => a[1] - b[1]);
  const text = entries.map(([w]) => w).join(" ");
  return text || null;
}

function parseOpenAlex(w: OpenAlexWork): RawSource | null {
  const title = w.title?.trim();
  if (!title) return null;
  return {
    title,
    authors: (w.authorships ?? []).map((a) => a.author?.display_name ?? "").filter(Boolean),
    year: typeof w.publication_year === "number" ? w.publication_year : null,
    publication: w.primary_location?.source?.display_name ?? null,
    doi: normalizeDoi(w.doi),
    url: w.doi ? `https://doi.org/${normalizeDoi(w.doi)}` : (w.id ?? null),
    abstract: abstractFromIndex(w.abstract_inverted_index),
    sourceType: w.type ?? null,
    provider: "openalex",
  };
}

export async function searchOpenAlex(query: string, limit = 10): Promise<RawSource[]> {
  const url =
    `https://api.openalex.org/works?search=${encodeURIComponent(query)}` +
    `&filter=from_publication_date:${MIN_YEAR}-01-01,to_publication_date:${MAX_YEAR}-12-31&per-page=${limit}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "AssignMe/1.0 (mailto:support@assignme.app)", Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`OpenAlex error: ${res.status}`);
  const json = (await res.json()) as { results?: OpenAlexWork[] };
  return (json.results ?? []).map(parseOpenAlex).filter((s): s is RawSource => s !== null);
}

/** Dedupe by DOI (preferred) or normalized title; drop out-of-window years. */
export function dedupeAndFilter(sources: RawSource[]): RawSource[] {
  const seen = new Set<string>();
  const out: RawSource[] = [];
  for (const s of sources) {
    if (s.year !== null && (s.year < MIN_YEAR || s.year > MAX_YEAR)) continue;
    // DOIs are case-insensitive: normalize defensively (providers already do).
    const doi = s.doi?.trim().toLowerCase() || null;
    const key = doi ? `doi:${doi}` : `title:${s.title.toLowerCase().replace(/\s+/g, " ").trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(doi && doi !== s.doi ? { ...s, doi } : s);
  }
  return out;
}

export async function searchAll(query: string, limit = 10): Promise<RawSource[]> {
  const [a, b] = await Promise.allSettled([searchCrossref(query, limit), searchOpenAlex(query, limit)]);
  const merged = [
    ...(a.status === "fulfilled" ? a.value : []),
    ...(b.status === "fulfilled" ? b.value : []),
  ];
  return dedupeAndFilter(merged);
}
