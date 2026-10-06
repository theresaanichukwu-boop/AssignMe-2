import { Badge } from "../ui/Badge";

type AIStatus = "DRAFT" | "VERIFIED" | "NEEDS_REVIEW" | "BLOCKED" | "ERROR";

const statusTone: Record<AIStatus, "neutral" | "success" | "warning" | "error" | "info"> = {
  DRAFT: "neutral",
  VERIFIED: "success",
  NEEDS_REVIEW: "warning",
  BLOCKED: "error",
  ERROR: "error",
};

export function AIResponseCard({
  status,
  answer,
  rationale,
  warnings = [],
  nextStep,
}: {
  status: AIStatus;
  answer: string;
  rationale?: string;
  warnings?: string[];
  nextStep?: string;
}) {
  return (
    <article aria-label={`AI response: ${status}`} className="rounded-lg border border-navy-100 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-semibold">Supervisor draft</h4>
        <Badge tone={statusTone[status]}>{status.replace("_", " ")}</Badge>
      </div>
      <div className="prose mt-3 max-w-none font-serif text-base">
        <p>{answer}</p>
      </div>
      {rationale && (
        <p className="mt-3 rounded-md bg-navy-50 p-3 text-sm">
          <span className="font-semibold">Why this matters: </span>
          {rationale}
        </p>
      )}
      {warnings.length > 0 && (
        <ul className="mt-3 space-y-1">
          {warnings.map((w) => (
            <li key={w} role="alert" className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {w}
            </li>
          ))}
        </ul>
      )}
      {nextStep && <p className="mt-3 text-sm font-medium text-teal-800">Next: {nextStep}</p>}
    </article>
  );
}

type Severity = "CRITICAL" | "MAJOR" | "MODERATE" | "MINOR" | "SUGGESTION";

const severityTone: Record<Severity, "error" | "warning" | "info" | "neutral" | "accent"> = {
  CRITICAL: "error",
  MAJOR: "warning",
  MODERATE: "info",
  MINOR: "neutral",
  SUGGESTION: "accent",
};

export function ReviewerIssueCard({
  severity,
  dimension,
  message,
}: {
  severity: Severity;
  dimension: string;
  message: string;
}) {
  return (
    <article className="rounded-lg border border-navy-100 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={severityTone[severity]}>{severity}</Badge>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{dimension}</span>
      </div>
      <p className="mt-2 text-sm">{message}</p>
    </article>
  );
}
