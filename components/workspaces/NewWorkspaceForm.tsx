"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Fields";
import { Select } from "@/components/ui/Fields";
import { Button } from "@/components/ui/Button";

const WORK_TYPES = [
  "SEMINAR",
  "RESEARCH_PROJECT",
  "LITERATURE_REVIEW",
  "CASE_STUDY",
  "ESSAY",
  "ASSIGNMENT",
];

export function NewWorkspaceForm({ disciplines }: { disciplines: string[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      aria-label="Create workspace"
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setErr(null);
        const data = new FormData(e.currentTarget);
        const payload = {
          title: String(data.get("title") ?? ""),
          workType: String(data.get("workType") ?? "ESSAY"),
          discipline: String(data.get("discipline") ?? "") || undefined,
          course: String(data.get("course") ?? "") || undefined,
          topic: String(data.get("topic") ?? ""),
          citationStyle: String(data.get("citationStyle") ?? "APA_7"),
        };
        const res = await fetch("/api/workspaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        setLoading(false);
        if (!json.ok) {
          setErr(json.error?.message ?? "Could not create workspace.");
          return;
        }
        router.push(`/workspaces/${json.data.workspace.id}/overview`);
        router.refresh();
      }}
    >
      <Input label="Title" name="title" required />
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Work type"
          name="workType"
          options={WORK_TYPES.map((w) => ({ value: w, label: w.replace(/_/g, " ") }))}
        />
        <Select
          label="Discipline"
          name="discipline"
          options={[{ value: "", label: "Select…" }, ...disciplines.map((d) => ({ value: d, label: d }))]}
        />
      </div>
      <Input label="Course (optional)" name="course" />
      <Textarea label="Topic / task" name="topic" required />
      <Select
        label="Citation style"
        name="citationStyle"
        options={["APA_7", "MLA_9", "CHICAGO", "HARVARD", "VANCOUVER", "IEEE"].map((s) => ({
          value: s,
          label: s.replace("_", " "),
        }))}
      />
      {err && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </p>
      )}
      <Button type="submit" loading={loading}>
        Create workspace
      </Button>
    </form>
  );
}
