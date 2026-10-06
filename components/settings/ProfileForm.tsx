"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Fields";
import { Button } from "@/components/ui/Button";

export function ProfileForm({ initial }: { initial: Record<string, string | null> }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <form
      aria-label="Academic profile"
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);
        const data = new FormData(e.currentTarget);
        const payload = Object.fromEntries(
          [...data.entries()].map(([k, v]) => [k, String(v) || undefined])
        );
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        setLoading(false);
        setStatus(json.ok ? "Saved" : (json.error?.message ?? "Save failed."));
      }}
    >
      <Input label="Institution" name="institution" defaultValue={initial.institution ?? ""} />
      <Input label="Faculty / school" name="faculty" defaultValue={initial.faculty ?? ""} />
      <Input label="Department" name="department" defaultValue={initial.department ?? ""} />
      <Input label="Programme" name="programme" defaultValue={initial.programme ?? ""} />
      <Input label="Academic level" name="academicLevel" defaultValue={initial.academicLevel ?? ""} />
      <Input label="Course" name="course" defaultValue={initial.course ?? ""} />
      <Input label="Discipline" name="discipline" defaultValue={initial.discipline ?? ""} />
      <Input label="Country / region" name="country" defaultValue={initial.country ?? ""} />
      <Select
        label="Citation style"
        name="citationStyle"
        options={["APA_7", "MLA_9", "CHICAGO", "HARVARD", "VANCOUVER", "IEEE"].map((s) => ({
          value: s,
          label: s.replace("_", " "),
        }))}
        defaultValue={initial.citationStyle ?? "APA_7"}
      />
      <Input label="Supervisor / lecturer (optional)" name="supervisor" defaultValue={initial.supervisor ?? ""} />
      <div className="md:col-span-2">
        <Button type="submit" loading={loading}>
          Save profile
        </Button>
        {status && (
          <p role="status" aria-live="polite" className="mt-2 text-sm text-slate-600">
            {status}
          </p>
        )}
      </div>
    </form>
  );
}
