"use client";

import { useState } from "react";

export function Editor({
  label,
  initialValue = "",
  onSave,
}: {
  label: string;
  initialValue?: string;
  onSave?: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  return (
    <div>
      <label htmlFor="academic-editor" className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <textarea
        id="academic-editor"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setStatus("idle");
        }}
        rows={12}
        className="w-full rounded-lg border border-navy-100 bg-white p-4 font-serif text-base leading-relaxed focus:border-teal-700 focus:outline-2 focus:outline-teal-700"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setStatus("saving");
            try {
              onSave?.(value);
              setStatus("saved");
            } catch {
              setStatus("failed");
            }
          }}
          className="rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          Save version
        </button>
        <p role="status" aria-live="polite" className="text-xs text-slate-500">
          {status === "saving" && "Saving…"}
          {status === "saved" && "Saved"}
          {status === "failed" && "Save failed — your text is preserved above"}
          {status === "idle" && `${value.length} characters`}
        </p>
      </div>
    </div>
  );
}

export function VersionHistory({
  versions,
  onRestore,
}: {
  versions: Array<{ version: number; createdAt: string; preview: string }>;
  onRestore?: (version: number) => void;
}) {
  if (versions.length === 0) {
    return <p className="text-sm text-slate-500">No versions yet. Save to create the first snapshot.</p>;
  }
  return (
    <ol className="space-y-2">
      {versions.map((v) => (
        <li
          key={v.version}
          className="flex items-center justify-between gap-3 rounded-md border border-navy-100 bg-white px-3 py-2"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">Version {v.version}</p>
            <p className="truncate text-xs text-slate-500">
              {v.createdAt} · {v.preview}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRestore?.(v.version)}
            className="shrink-0 rounded-md border border-navy-100 px-3 py-1.5 text-sm hover:border-teal-700 focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            Restore
          </button>
        </li>
      ))}
    </ol>
  );
}
