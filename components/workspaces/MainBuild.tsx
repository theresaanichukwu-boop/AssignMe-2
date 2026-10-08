"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Fields";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { resolveObjectivesRequirement, WORK_TYPES, type WorkTypeKey } from "@/lib/academic/work-types";

export interface MainBuildData {
  title: string;
  workType: string;
  topic: string;
  objectives: string[];
  course: string | null;
  academicLevel: string | null;
  discipline: string | null;
  citationStyle: string;
  instructions: string;
  sourceYearFrom: number | null;
  sourceYearTo: number | null;
}

/** Optional Topic & Objectives Helper (spec §2). Advisory only — never writes. */
export function TopicHelper({
  workspaceId,
  workType,
  onUseTopic,
  onUseObjectives,
}: {
  workspaceId: string;
  workType: string;
  onUseTopic: (topic: string) => void;
  onUseObjectives: (objectives: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("topic-ideas");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAnswer(null);
    setStatus("");
    const res = await fetch(`/api/workspaces/${workspaceId}/helper`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, input }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setStatus(json.error?.message ?? "Helper failed.");
      return;
    }
    setAnswer(json.data.result.answer || "(no suggestions returned)");
  }

  function extractLines(): string[] {
    if (!answer) return [];
    return answer
      .split("\n")
      .map((l) => l.replace(/^\s*(?:\d+[.)]|[-*])\s*/, "").trim())
      .filter((l) => l.length > 10);
  }

  return (
    <Card title="Topic & Objectives Helper (optional)">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-1 text-sm font-medium text-teal-800 hover:underline"
      >
        {open ? "Hide helper" : "Need help with topics or objectives? Open helper"}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-slate-500">
            Suggestions only — for {workType.replace(/_/g, " ").toLowerCase()}. Accept, edit, reject,
            or ignore; your supervisor approves the final topic.
          </p>
          <form onSubmit={(e) => void ask(e)} className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">What do you need?</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="h-10 w-full rounded-md border border-navy-100 bg-white px-3 text-sm"
              >
                <option value="topic-ideas">Generate topic ideas</option>
                <option value="refine-topic">Refine / check my topic</option>
                <option value="objectives">Develop objectives</option>
                <option value="alignment">Check topic/objective alignment</option>
              </select>
            </label>
            <Textarea label="Your interest, draft topic, or topic + objectives" value={input} onChange={(e) => setInput(e.target.value)} required />
            <Button type="submit" loading={loading}>
              Get suggestions
            </Button>
          </form>
          {status && <p role="alert" className="text-sm text-red-700">{status}</p>}
          {answer && (
            <div className="rounded-md bg-navy-50 p-3 text-sm">
              <p className="whitespace-pre-wrap">{answer}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(mode === "topic-ideas" || mode === "refine-topic") && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const first = extractLines()[0];
                      if (first) onUseTopic(first);
                    }}
                  >
                    Use first suggestion as topic
                  </Button>
                )}
                {mode === "objectives" && (
                  <Button size="sm" variant="secondary" onClick={() => onUseObjectives(extractLines())}>
                    Use as objectives
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setAnswer(null)}>
                  Reject
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/** Main Build — the source of truth for drafting (spec §4). */
export function MainBuild({
  workspaceId,
  initial,
  onSaved,
  topicDraft,
  objectivesDraft,
  onDraftConsumed,
}: {
  workspaceId: string;
  initial: MainBuildData;
  onSaved: (data: MainBuildData) => void;
  topicDraft: string | null;
  objectivesDraft: string[] | null;
  onDraftConsumed: () => void;
}) {
  const [form, setForm] = useState({
    title: initial.title,
    topic: initial.topic,
    objectives: initial.objectives.join("\n"),
    course: initial.course ?? "",
    academicLevel: initial.academicLevel ?? "",
    instructions: initial.instructions ?? "",
    sourceYearFrom: initial.sourceYearFrom?.toString() ?? "",
    sourceYearTo: initial.sourceYearTo?.toString() ?? "",
  });
  const [forceObjectives, setForceObjectives] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (topicDraft !== null) {
      setForm((f) => (f.topic === topicDraft ? f : { ...f, topic: topicDraft }));
      onDraftConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicDraft]);
  useEffect(() => {
    if (objectivesDraft !== null) {
      const joined = objectivesDraft.join("\n");
      setForm((f) => (f.objectives === joined ? f : { ...f, objectives: joined }));
      onDraftConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectivesDraft]);

  const decision = resolveObjectivesRequirement({
    workType: initial.workType as WorkTypeKey,
    topic: form.topic,
    instructions: form.instructions,
  });
  const showObjectives = decision.needed || forceObjectives;
  const purpose = WORK_TYPES[initial.workType as WorkTypeKey]?.purpose ?? "";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    const payload: Record<string, unknown> = {
      title: form.title,
      topic: form.topic,
      course: form.course || undefined,
      academicLevel: form.academicLevel || undefined,
      instructions: form.instructions,
      sourceYearFrom: form.sourceYearFrom ? Number(form.sourceYearFrom) : null,
      sourceYearTo: form.sourceYearTo ? Number(form.sourceYearTo) : null,
    };
    if (showObjectives) {
      payload.objectives = form.objectives.split("\n").map((o) => o.trim()).filter(Boolean);
    }
    const res = await fetch(`/api/workspaces/${workspaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setStatus(json.error?.message ?? "Save failed.");
      return;
    }
    setStatus("Main Build saved — drafting now uses this information.");
    onSaved({
      ...initial,
      title: form.title,
      topic: form.topic,
      objectives: showObjectives ? (payload.objectives as string[]) : [],
      course: form.course || null,
      academicLevel: form.academicLevel || null,
      instructions: form.instructions,
      sourceYearFrom: payload.sourceYearFrom as number | null,
      sourceYearTo: payload.sourceYearTo as number | null,
    });
  }

  return (
    <Card title="Main Build — approved work">
      <p className="mt-1 text-xs text-slate-500">{purpose} You may skip the helper entirely.</p>
      <form onSubmit={(e) => void save(e)} className="mt-3 space-y-3">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <Textarea label="Actual / approved topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required />
        <div className="rounded-md bg-navy-50 px-3 py-2 text-xs text-slate-600" role="status">
          Objectives: {decision.needed ? "recommended" : "not required"} — {decision.reason}
          {!decision.needed && (
            <button type="button" onClick={() => setForceObjectives((v) => !v)} className="ml-2 font-medium text-teal-800 hover:underline">
              {forceObjectives ? "Hide objectives field" : "Add objectives anyway"}
            </button>
          )}
        </div>
        {showObjectives && (
          <Textarea label="Objectives (one per line)" value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} />
        )}
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Course / subject" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
          <Input label="Academic level" value={form.academicLevel} onChange={(e) => setForm({ ...form, academicLevel: e.target.value })} />
        </div>
        <Textarea label="Supervisor instructions / requirements" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Sources from year (blank = rolling)" value={form.sourceYearFrom} inputMode="numeric" onChange={(e) => setForm({ ...form, sourceYearFrom: e.target.value })} />
          <Input label="Sources to year (blank = rolling)" value={form.sourceYearTo} inputMode="numeric" onChange={(e) => setForm({ ...form, sourceYearTo: e.target.value })} />
        </div>
        <Button type="submit" loading={loading}>
          Save Main Build
        </Button>
        {status && (
          <p role="status" aria-live="polite" className="text-sm text-slate-600">
            {status}
          </p>
        )}
      </form>
    </Card>
  );
}
