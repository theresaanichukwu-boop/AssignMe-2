"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Editor } from "@/components/academic/Editor";

export function SectionEditor({ workspaceId }: { workspaceId: string }) {
  const [sections, setSections] = useState<Array<{ id: string; key: string; title: string; content: string }>>([]);
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const active = sections.find((s) => s.id === activeId) ?? null;

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    const res = await fetch(`/api/workspaces/${workspaceId}/sections`);
    const json = await res.json();
    if (json.ok) {
      setSections(json.data.sections);
      if (!activeId && json.data.sections.length > 0) setActiveId(json.data.sections[0].id);
    }
  }

  async function saveSection(sectionKey: string, sectionTitle: string, content: string) {
    setStatus("Saving…");
    const res = await fetch(`/api/workspaces/${workspaceId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: sectionKey, title: sectionTitle, content }),
    });
    const json = await res.json();
    if (!json.ok) {
      setStatus("Save failed — your text is preserved.");
      return;
    }
    setStatus("Saved");
    await refresh();
    setActiveId(json.data.section.id);
    // Snapshot a version on every save.
    await fetch(`/api/workspaces/${workspaceId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId: json.data.section.id }),
    });
  }

  return (
    <div className="space-y-4">
      <form
        aria-label="Add section"
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (key && title) {
            void saveSection(key, title, "");
            setKey("");
            setTitle("");
          }
        }}
      >
        <div className="min-w-40 flex-1">
          <Input label="Section key" value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. introduction" />
        </div>
        <div className="min-w-40 flex-1">
          <Input label="Section title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Introduction" />
        </div>
        <Button type="submit">Add section</Button>
      </form>

      {sections.length > 0 && (
        <div role="tablist" aria-label="Sections" className="flex flex-wrap gap-1 border-b border-navy-100">
          {sections.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === activeId}
              onClick={() => setActiveId(s.id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${s.id === activeId ? "border-teal-700 font-semibold" : "border-transparent text-slate-500"}`}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      {active ? (
        <Editor
          key={active.id}
          label={`Editing: ${active.title}`}
          initialValue={active.content}
          onSave={(v) => void saveSection(active.key, active.title, v)}
        />
      ) : (
        <p className="text-sm text-slate-500">No sections yet. Add the first section above.</p>
      )}
      <p role="status" aria-live="polite" className="text-xs text-slate-500">{status}</p>
    </div>
  );
}
