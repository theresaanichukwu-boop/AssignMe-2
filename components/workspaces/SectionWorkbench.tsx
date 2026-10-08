"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Fields";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Overlays";
import { AIResponseCard } from "@/components/academic/Review";

export interface Section {
  id: string;
  key: string;
  title: string;
  content: string;
  order: number;
}

export function slugify(title: string): string {
  return (
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "section"
  );
}

interface DraftResult {
  status: string;
  answer: string;
  rationale: string | null;
  warnings: string[];
  nextStep: string | null;
}

export function SectionWorkbench({
  workspaceId,
  workType,
  topic,
  sections,
  templateSections,
  onChanged,
}: {
  workspaceId: string;
  workType: string;
  topic: string;
  sections: Section[];
  templateSections: string[];
  onChanged: () => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [status, setStatus] = useState("");

  const active = sections.find((s) => s.id === activeId) ?? null;
  const shown = editing ? editValue : (draft?.answer ?? "");

  async function api(path: string, options?: RequestInit) {
    const res = await fetch(path, options);
    return res.json();
  }

  function pickActive(list: Section[], prevId: string | null): string | null {
    if (prevId && list.some((s) => s.id === prevId)) return prevId;
    return list[0]?.id ?? null;
  }

  async function createSections(titles: string[]) {
    let order = sections.length;
    for (const title of titles) {
      await api(`/api/workspaces/${workspaceId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: `${slugify(title)}`, title, content: "", order: order++ }),
      });
    }
    onChanged();
  }

  async function suggestStructure() {
    setStatus("Asking supervisor for a structure…");
    const json = await api(`/api/workspaces/${workspaceId}/helper`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "structure", input: `${workType} on: ${topic}` }),
    });
    if (!json.ok) {
      setStatus(json.error?.message ?? "Structure suggestion failed.");
      return;
    }
    const titles: string[] = String(json.data.result.answer)
      .split("\n")
      .map((l: string) => l.replace(/^\s*(?:\d+[.)]|[-*])\s*/, "").replace(/\s*[-–:].*$/, "").trim())
      .filter((l: string) => l.length > 2 && l.length < 120)
      .slice(0, 12);
    if (titles.length === 0) {
      setStatus("No usable structure returned — try again.");
      return;
    }
    await createSections(titles);
    setStatus(`Created ${titles.length} supervisor-suggested sections. Adjust freely.`);
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = sections.findIndex((s) => s.id === id);
    const other = sections[idx + dir];
    if (!other) return;
    const cur = sections[idx];
    await api(`/api/workspaces/${workspaceId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: cur.key, title: cur.title, content: cur.content, order: other.order }),
    });
    await api(`/api/workspaces/${workspaceId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: other.key, title: other.title, content: other.content, order: cur.order }),
    });
    onChanged();
  }

  async function remove(id: string) {
    await fetch(`/api/workspaces/${workspaceId}/sections?sectionId=${id}`, { method: "DELETE" });
    if (activeId === id) {
      setActiveId(null);
      setDraft(null);
      setBrief("");
    }
    onChanged();
  }

  async function generateBrief() {
    if (!active) return;
    setBriefLoading(true);
    const json = await api(`/api/workspaces/${workspaceId}/helper`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "brief", input: topic, sectionTitle: active.title }),
    });
    setBriefLoading(false);
    if (!json.ok) {
      setStatus(json.error?.message ?? "Brief failed.");
      return;
    }
    setBrief(json.data.result.answer);
  }

  async function generateDraft() {
    if (!active || !brief.trim()) return;
    setLoading(true);
    setDraft(null);
    setAccepted(false);
    setEditing(false);
    const json = await api(`/api/workspaces/${workspaceId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: brief, sectionTitle: active.title, sectionKey: active.key, mode: "BUILD_WITH_ME" }),
    });
    setLoading(false);
    if (!json.ok) {
      setStatus(json.error?.message ?? "Generation failed.");
      return;
    }
    setDraft(json.data.result);
  }

  async function addToEditor() {
    if (!active || !shown.trim()) return;
    if (active.content.trim() && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }
    setConfirmOverwrite(false);
    await api(`/api/workspaces/${workspaceId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: active.key, title: active.title, content: shown, order: active.order }),
    });
    await api(`/api/workspaces/${workspaceId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId: active.id }),
    });
    setStatus(`Added to Editor → ${active.title}. Versions snapshot created.`);
    onChanged();
  }

  return (
    <div className="space-y-6">
      <Card title="Academic structure">
        {sections.length === 0 ? (
          <div className="mt-2 space-y-2">
            <p className="text-sm text-slate-500">No sections yet. Start from the template or ask the supervisor.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void createSections(templateSections)}>
                Use {workType.replace(/_/g, " ").toLowerCase()} template ({templateSections.length})
              </Button>
              <Button onClick={() => void suggestStructure()}>Suggest structure for my topic</Button>
            </div>
          </div>
        ) : (
          <ul className="mt-2 space-y-1">
            {sections.map((s, i) => (
              <li
                key={s.id}
                className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm ${s.id === activeId ? "border-teal-700 bg-teal-50" : "border-navy-100"}`}
              >
                <button type="button" onClick={() => { setActiveId(s.id); setDraft(null); setBrief(""); setAccepted(false); }} className="min-w-0 flex-1 text-left font-medium hover:underline" aria-current={s.id === activeId ? "true" : undefined}>
                  <span className="text-slate-400">{i + 1}. </span>
                  {renaming === s.id ? (
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void api(`/api/workspaces/${workspaceId}/sections`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ key: s.key, title: renameValue || s.title, content: s.content, order: s.order }),
                          }).then(() => {
                            setRenaming(null);
                            onChanged();
                          });
                        }
                      }}
                      className="w-40 rounded border border-navy-100 px-1"
                      aria-label="Rename section"
                    />
                  ) : (
                    s.title
                  )}
                </button>
                {s.content.trim() && <Badge tone="success">drafted</Badge>}
                <button type="button" aria-label={`Move ${s.title} up`} disabled={i === 0} onClick={() => void move(s.id, -1)} className="px-1 disabled:opacity-30">↑</button>
                <button type="button" aria-label={`Move ${s.title} down`} disabled={i === sections.length - 1} onClick={() => void move(s.id, 1)} className="px-1 disabled:opacity-30">↓</button>
                <button
                  type="button"
                  onClick={() => {
                    if (renaming === s.id) setRenaming(null);
                    else {
                      setRenaming(s.id);
                      setRenameValue(s.title);
                    }
                  }}
                  className="text-xs text-teal-800 hover:underline"
                >
                  Rename
                </button>
                <button type="button" onClick={() => void remove(s.id)} className="text-xs text-red-700 hover:underline">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (newTitle.trim()) {
              void createSections([newTitle.trim()]).then(() => setNewTitle(""));
            }
          }}
        >
          <div className="flex-1">
            <Input label="Add section" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Data Analysis" />
          </div>
          <div className="pt-6">
            <Button type="submit" variant="secondary">
              Add
            </Button>
          </div>
        </form>
      </Card>

      {active && (
        <Card title={`Build With Me — ${active.title}`}>
          <p className="mt-1 font-mono text-xs text-slate-500">key: {active.key}</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="section-brief" className="text-sm font-medium">
                What should this section cover?
              </label>
              <Button size="sm" variant="secondary" loading={briefLoading} onClick={() => void generateBrief()}>
                Generate brief
              </Button>
            </div>
            <Textarea id="section-brief" label="Section brief (editable)" value={brief} onChange={(e) => setBrief(e.target.value)} />
            <Button loading={loading} disabled={!brief.trim()} onClick={() => void generateDraft()}>
              Generate Draft
            </Button>
          </div>

          {draft && draft.answer && (
            <div className="mt-4 space-y-3">
              <h3 className="text-base font-semibold">Generated Draft</h3>
              {editing ? (
                <Textarea label="Edit draft" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
              ) : (
                <AIResponseCard
                  status={draft.status as "DRAFT" | "VERIFIED" | "NEEDS_REVIEW" | "BLOCKED" | "ERROR"}
                  answer={draft.answer}
                  rationale={draft.rationale ?? undefined}
                  warnings={draft.warnings}
                  nextStep={draft.nextStep ?? undefined}
                />
              )}
              <div className="flex flex-wrap gap-2">
                {!editing && (
                  <Button variant="secondary" onClick={() => { setEditValue(draft.answer); setEditing(true); }}>
                    Edit
                  </Button>
                )}
                <Button variant="secondary" loading={loading} onClick={() => void generateDraft()}>
                  Regenerate
                </Button>
                <Button variant={accepted ? "accent" : "secondary"} onClick={() => setAccepted(true)}>
                  {accepted ? "Accepted ✓" : "Accept Draft"}
                </Button>
                <Button disabled={!accepted} onClick={() => void addToEditor()}>
                  Add to Editor
                </Button>
              </div>
              {!accepted && (
                <p className="text-xs text-slate-500">Accept the draft to enable “Add to Editor”.</p>
              )}
            </div>
          )}
          {status && (
            <p role="status" aria-live="polite" className="mt-2 text-sm text-slate-600">
              {status}
            </p>
          )}
        </Card>
      )}

      <Modal open={confirmOverwrite} title="Overwrite section?" onClose={() => setConfirmOverwrite(false)}>
        <p className="text-sm">
          “{active?.title}” already has content in the Editor. Replace it with this accepted draft?
          A version snapshot is created either way.
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => void addToEditor()}>Replace content</Button>
          <Button variant="secondary" onClick={() => setConfirmOverwrite(false)}>
            Keep existing
          </Button>
        </div>
      </Modal>
    </div>
  );
}
