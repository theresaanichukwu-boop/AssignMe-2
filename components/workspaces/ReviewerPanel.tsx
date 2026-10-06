"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Fields";
import { ReviewerIssueCard } from "@/components/academic/Review";

interface Issue {
  id: string;
  severity: "CRITICAL" | "MAJOR" | "MODERATE" | "MINOR" | "SUGGESTION";
  dimension: string;
  message: string;
}

export function ReviewerPanel({ workspaceId }: { workspaceId: string }) {
  const [sections, setSections] = useState<Array<{ id: string; title: string }>>([]);
  const [sectionId, setSectionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}/sections`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setSections(j.data.sections);
          if (j.data.sections.length > 0) setSectionId(j.data.sections[0].id);
        }
      })
      .catch(() => undefined);
  }, [workspaceId]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    const res = await fetch(`/api/workspaces/${workspaceId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setStatus(json.error?.message ?? "Review failed.");
      return;
    }
    setIssues(json.data.review.issues);
    setStatus(json.data.review.summary);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => void run(e)} className="flex flex-wrap items-end gap-2">
        <div className="min-w-60 flex-1">
          <Select
            label="Section to review"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            options={sections.map((s) => ({ value: s.id, label: s.title }))}
          />
        </div>
        <Button type="submit" loading={loading} disabled={!sectionId}>
          Run review
        </Button>
      </form>
      {status && (
        <p role="status" aria-live="polite" className="text-sm text-slate-600">
          {status}
        </p>
      )}
      <ul className="grid gap-3 md:grid-cols-2">
        {issues.map((i) => (
          <li key={i.id}>
            <ReviewerIssueCard severity={i.severity} dimension={i.dimension} message={i.message} />
          </li>
        ))}
      </ul>
    </div>
  );
}
