"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Discipline {
  id: string;
  name: string;
  pack: { version: number } | null;
}

export function DisciplinesPanel() {
  const [discs, setDiscs] = useState<Discipline[]>([]);
  const [templates, setTemplates] = useState<Array<{ key: string; name: string; version: number }>>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/admin/disciplines")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setDiscs(j.data.disciplines);
          setTemplates(j.data.templates);
        } else setStatus(j.error?.message ?? "Forbidden.");
      })
      .catch(() => setStatus("Failed to load."));
  }, []);

  return (
    <div className="space-y-4">
      <Card title={`Discipline packs (${discs.length})`}>
        {status && <p role="alert" className="mt-2 text-sm text-red-700">{status}</p>}
        <ul className="mt-2 space-y-1 text-sm">
          {discs.map((d) => (
            <li key={d.id} className="flex justify-between gap-2">
              <span>{d.name}</span>
              <span className="text-slate-500">pack v{d.pack?.version ?? "—"}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          Pack JSON editing ships via API (`PATCH /api/admin/disciplines`); UI editor follows in Quality phase if needed.
        </p>
      </Card>
      <Card title={`Work-type templates (${templates.length})`}>
        <ul className="mt-2 space-y-1 text-sm">
          {templates.map((t) => (
            <li key={t.key}>
              {t.name} <span className="text-slate-500">· v{t.version}</span>
            </li>
          ))}
        </ul>
      </Card>
      <div>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    </div>
  );
}
