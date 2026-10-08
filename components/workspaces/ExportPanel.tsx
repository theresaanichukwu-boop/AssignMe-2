"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Card";

export function ExportPanel({ workspaceId, title }: { workspaceId: string; title: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Array<{ severity: string; dimension?: string; message: string }>>([]);

  async function download() {
    setLoading(true);
    setError(null);
    setIssues([]);
    const res = await fetch(`/api/workspaces/${workspaceId}/export`, { method: "POST" });
    if (!res.ok) {
      let msg = "Export failed.";
      try {
        const json = await res.json();
        msg = json.error?.message ?? msg;
        if (json.error?.issues) setIssues(json.error.issues);
      } catch { /* keep default */ }
      setError(msg);
      setLoading(false);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 60) || "export"}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <section aria-label="DOCX export">
        <h2 className="text-lg font-semibold">DOCX</h2>
        <p className="mt-1 text-sm text-slate-500">
          Runs the final check (sections, consistency, citations, reviewer issues). Critical problems block export with a report.
        </p>
        <div className="mt-2">
          <Button loading={loading} onClick={() => void download()}>
            Download DOCX
          </Button>
        </div>
        {error && (
          <div className="mt-3">
            <Alert tone="error">{error}</Alert>
            {issues.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {issues.map((i, idx) => (
                  <li key={idx} className="rounded-md border border-navy-100 px-3 py-2">
                    <strong>{i.severity}</strong> {i.dimension ? `· ${i.dimension} · ` : ""}{i.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
      <section aria-label="PDF export">
        <h2 className="text-lg font-semibold">PDF</h2>
        <p className="mt-1 text-sm text-slate-500">
          Server-side PDF rendering is not yet configured. Use your browser's Print → Save as PDF on the Editor view;
          print styles are optimized for academic output.
        </p>
        <div className="mt-2">
          <Button variant="secondary" onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
        </div>
      </section>
    </div>
  );
}
