"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Fields";
import { Select } from "@/components/ui/Fields";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const CATEGORIES = [
  "incorrect-ai-information",
  "incorrect-sources",
  "citation-problems",
  "technical-problems",
  "privacy-concerns",
  "payment-issues",
  "other",
];

interface Ticket {
  id: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
}

export function SupportPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function refresh() {
    const res = await fetch("/api/support");
    const json = await res.json();
    if (json.ok) setTickets(json.data.tickets);
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Report an issue">
        <form
          className="mt-3 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setStatus("");
            const data = new FormData(e.currentTarget);
            const res = await fetch("/api/support", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                category: String(data.get("category")),
                subject: String(data.get("subject")),
                description: String(data.get("description")),
              }),
            });
            const json = await res.json();
            setLoading(false);
            if (!json.ok) {
              setStatus(json.error?.message ?? "Could not submit.");
              return;
            }
            (e.target as HTMLFormElement).reset();
            setStatus("Ticket submitted. AI-accuracy reports also feed our quality reviews.");
            await refresh();
          }}
        >
          <Select label="Category" name="category" options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <Input label="Subject" name="subject" required />
          <Textarea label="Description" name="description" required />
          <Button type="submit" loading={loading}>
            Submit ticket
          </Button>
          {status && (
            <p role="status" aria-live="polite" className="text-sm text-slate-600">
              {status}
            </p>
          )}
        </form>
      </Card>
      <Card title={`Your tickets (${tickets.length})`}>
        <ul className="mt-3 space-y-2">
          {tickets.map((t) => (
            <li key={t.id} className="rounded-md border border-navy-100 px-3 py-2 text-sm">
              <p className="font-medium">{t.subject}</p>
              <p className="mt-1 flex flex-wrap gap-1">
                <Badge>{t.status}</Badge>
                <Badge tone="info">{t.category}</Badge>
              </p>
            </li>
          ))}
          {tickets.length === 0 && <p className="text-sm text-slate-500">No tickets yet.</p>}
        </ul>
      </Card>
    </div>
  );
}
