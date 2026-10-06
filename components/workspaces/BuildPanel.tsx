"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Fields";
import { AIResponseCard } from "@/components/academic/Review";

interface TemplateSection {
  sections?: string[];
}

export function BuildPanel({ workspaceId }: { workspaceId: string }) {
  const [structure, setStructure] = useState<string[]>([]);
  const [task, setTask] = useState("");
  const [sectionKey, setSectionKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: string; answer: string; rationale: string | null; warnings: string[]; nextStep: string | null } | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/work-types")
      .then((r) => r.json())
      .then(() => {
        /* structure loads per-workspace via overview; keep panel independent */
      })
      .catch(() => undefined);
  }, []);

  async function loadStructure() {
    const res = await fetch(`/api/workspaces/${workspaceId}`);
    const json = await res.json();
    if (!json.ok) return;
    const wt = json.data.workspace.workType;
    const tRes = await fetch("/api/work-types");
    const tJson = await tRes.json();
    const tpl = tJson.data?.workTypes?.find((t: { key: string }) => t.key === wt);
    const sections = (tpl?.structure as TemplateSection)?.sections ?? [];
    setStructure(sections);
  }

  useEffect(() => {
    void loadStructure();
  }, []);

  async function applyStructure() {
    setStatus("Creating sections…");
    for (let i = 0; i < structure.length; i++) {
      const title = structure[i];
      await fetch(`/api/workspaces/${workspaceId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          title,
          content: "",
          order: i,
        }),
      });
    }
    setStatus(`Created ${structure.length} sections. Draft each one below, section by section.`);
  }

  async function draft(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const res = await fetch(`/api/workspaces/${workspaceId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, sectionKey: sectionKey || undefined, sectionTitle: sectionKey || undefined, mode: "BUILD_WITH_ME" }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setStatus(json.error?.message ?? "Generation failed.");
      return;
    }
    setResult(json.data.result);
  }

  return (
    <div className="space-y-6">
      <section aria-label="Structure">
        <h2 className="text-lg font-semibold">1 · Structure from template</h2>
        {structure.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Loading template structure…</p>
        ) : (
          <>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              {structure.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <div className="mt-3">
              <Button variant="secondary" onClick={() => void applyStructure()}>
                Create these sections
              </Button>
            </div>
          </>
        )}
      </section>

      <section aria-label="Draft section">
        <h2 className="text-lg font-semibold">2 · Draft one section (Build With Me)</h2>
        <form onSubmit={(e) => void draft(e)} className="mt-2 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Section key (must match a section, e.g. introduction)</span>
            <input
              value={sectionKey}
              onChange={(e) => setSectionKey(e.target.value)}
              className="h-10 w-full rounded-md border border-navy-100 px-3 text-sm"
              placeholder="introduction"
            />
          </label>
          <Textarea label="What should this section cover?" value={task} onChange={(e) => setTask(e.target.value)} required />
          <Button type="submit" loading={loading}>
            Draft section
          </Button>
        </form>
        {result && result.answer && (
          <div className="mt-4">
            <AIResponseCard
              status={result.status as "DRAFT" | "VERIFIED" | "NEEDS_REVIEW" | "BLOCKED" | "ERROR"}
              answer={result.answer}
              rationale={result.rationale ?? undefined}
              warnings={result.warnings}
              nextStep={result.nextStep ?? undefined}
            />
            <div className="mt-3">
              <Button
                variant="secondary"
                onClick={async () => {
                  await fetch(`/api/workspaces/${workspaceId}/generate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ task: `Approve and save: ${task}`, sectionKey, sectionTitle: sectionKey, mode: "BUILD_WITH_ME", saveToSection: true }),
                  });
                  setStatus("Saved to section. Continue in the Editor tab.");
                }}
              >
                Approve & save to section
              </Button>
            </div>
          </div>
        )}
        {status && (
          <p role="status" aria-live="polite" className="mt-2 text-sm text-slate-600">
            {status}
          </p>
        )}
      </section>
    </div>
  );
}
