import { Badge } from "../ui/Badge";

export interface SourceItem {
  title: string;
  authors: string[];
  year?: number | null;
  publication?: string | null;
  doi?: string | null;
  verification: "UNVERIFIED" | "VERIFIED" | "FAILED";
}

export function SourceCard({ source }: { source: SourceItem }) {
  return (
    <article className="rounded-lg border border-navy-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-serif text-lg leading-snug">{source.title}</h4>
        <Badge
          tone={source.verification === "VERIFIED" ? "success" : source.verification === "FAILED" ? "error" : "neutral"}
        >
          {source.verification}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {source.authors.join(", ")}
        {source.year ? ` · ${source.year}` : ""}
        {source.publication ? ` · ${source.publication}` : ""}
      </p>
      {source.doi && (
        <p className="mt-2 font-mono text-xs text-teal-800">DOI: {source.doi}</p>
      )}
    </article>
  );
}

export interface EvidenceItem {
  finding: string;
  objective?: string | null;
  relevance?: string | null;
  limitations?: string | null;
}

export function EvidenceCard({ item }: { item: EvidenceItem }) {
  return (
    <article className="rounded-lg border border-navy-100 bg-white p-4">
      <p className="text-sm">{item.finding}</p>
      {item.objective && (
        <p className="mt-2 text-xs text-slate-500">
          <span className="font-semibold">Objective:</span> {item.objective}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {item.relevance && <Badge tone="info">{item.relevance}</Badge>}
        {item.limitations && <Badge tone="warning">Limit: {item.limitations}</Badge>}
      </div>
    </article>
  );
}

export function CitationChip({ text }: { text: string }) {
  return (
    <button
      type="button"
      title={text}
      className="inline-flex max-w-full items-center rounded-pill bg-navy-50 px-2.5 py-0.5 font-mono text-xs text-navy-900 hover:bg-navy-100 focus-visible:outline-2 focus-visible:outline-teal-700"
    >
      <span className="truncate">{text}</span>
    </button>
  );
}
