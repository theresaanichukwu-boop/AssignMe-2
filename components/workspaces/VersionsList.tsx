"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

interface Version {
  id: string;
  sectionId: string;
  version: number;
  content: string;
  createdAt: string;
}

export function VersionsList({ workspaceId }: { workspaceId: string }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [status, setStatus] = useState("");

  async function refresh() {
    const res = await fetch(`/api/workspaces/${workspaceId}/versions`);
    const json = await res.json();
    if (json.ok) setVersions(json.data.versions);
  }

  useEffect(() => {
    void refresh();
  }, []);

  if (versions.length === 0) {
    return <p className="text-sm text-slate-500">No versions yet. Save a section in the Editor to create one.</p>;
  }

  return (
    <ol className="space-y-2">
      {versions.map((v) => (
        <li key={v.id} className="flex items-center justify-between gap-3 rounded-md border border-navy-100 bg-white px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium">Version {v.version}</p>
            <p className="truncate text-xs text-slate-500">
              {new Date(v.createdAt).toLocaleString()} · {v.content.slice(0, 80)}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              setStatus("Restoring…");
              const res = await fetch(`/api/workspaces/${workspaceId}/versions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sectionId: v.sectionId, version: v.version }),
              });
              const json = await res.json();
              setStatus(json.ok ? `Restored as version ${json.data.version}.` : "Restore failed.");
              await refresh();
            }}
          >
            Restore
          </Button>
        </li>
      ))}
      {status && (
        <p role="status" aria-live="polite" className="text-xs text-slate-500">{status}</p>
      )}
    </ol>
  );
}
