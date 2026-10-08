"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SourceCard } from "@/components/academic/Evidence";
import { Badge } from "@/components/ui/Badge";

interface Found {
  title: string;
  authors: string[];
  year: number | null;
  publication: string | null;
  doi: string | null;
  provider: string;
}

export function ResearchPanel({ workspaceId }: { workspaceId: string }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Found[]>([]);
  const [saved, setSaved] = useState<number | null>(null);
  const [window, setWindow] = useState<{ from: number; to: number } | null>(null);
  const [status, setStatus] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    const res = await fetch(`/api/workspaces/${workspaceId}/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 10 }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setStatus(json.error?.message ?? "Research failed.");
      return;
    }
    setResults(json.data.results);
    setSaved(json.data.saved);
    setWindow(json.data.window ?? null);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => void search(e)} className="flex flex-wrap items-end gap-2" role="search">
        <div className="min-w-60 flex-1">
          <Input label="Search terms" value={query} onChange={(e) => setQuery(e.target.value)} required placeholder="e.g. constructivist classroom Nigeria" />
        </div>
        <Button type="submit" loading={loading}>
          Search Crossref + OpenAlex
        </Button>
      </form>
      <p className="text-xs text-slate-500">
        {window ? (
          <>Sources limited to {window.from}–{window.to} (set in Main Build; blank = rolling five years).</>
        ) : (
          <>Strict rolling five-year window. Older foundational works are excluded unless explicitly requested.</>
        )}
      </p>
      {saved !== null && (
        <p role="status" className="text-sm text-teal-800">
          {saved} source(s) verified and added to your workspace.
        </p>
      )}
      {status && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {status}
        </p>
      )}
      <ul className="grid gap-3 md:grid-cols-2">
        {results.map((r) => (
          <li key={r.doi ?? r.title}>
            <SourceCard
              source={{
                title: r.title,
                authors: r.authors,
                year: r.year,
                publication: r.publication,
                doi: r.doi,
                verification: "VERIFIED",
              }}
            />
            <p className="mt-1 text-xs text-slate-500">
              via {r.provider}{" "}
              {window && <Badge>{window.from}–{window.to}</Badge>}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
