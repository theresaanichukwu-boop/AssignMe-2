"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Fields";
import { Badge } from "@/components/ui/Badge";

interface Ticket {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  user: { email: string };
}

export function TicketsPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState("");

  async function refresh() {
    const res = await fetch("/api/admin/tickets");
    const json = await res.json();
    if (json.ok) setTickets(json.data.tickets);
    else setStatus(json.error?.message ?? "Forbidden.");
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function update(ticketId: string, patch: Record<string, string>) {
    const res = await fetch("/api/admin/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, ...patch }),
    });
    const json = await res.json();
    if (json.ok) await refresh();
    else setStatus(json.error?.message ?? "Update failed.");
  }

  return (
    <Card title={`Support queue (${tickets.length})`}>
      {status && <p role="alert" className="mt-2 text-sm text-red-700">{status}</p>}
      <ul className="mt-3 space-y-3">
        {tickets.map((t) => (
          <li key={t.id} className="rounded-md border border-navy-100 p-3 text-sm">
            <p className="font-medium">{t.subject}</p>
            <p className="mt-1 text-slate-500">{t.user.email} · {t.category}</p>
            <p className="mt-1 line-clamp-3 text-slate-600">{t.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge>{t.status}</Badge>
              <Badge tone="info">{t.priority}</Badge>
              <Select label="Status" value={t.status} onChange={(e) => void update(t.id, { status: e.target.value })} options={["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => ({ value: s, label: s }))} />
              <Button size="sm" variant="secondary" onClick={() => void update(t.id, { status: "RESOLVED" })}>
                Resolve
              </Button>
            </div>
          </li>
        ))}
        {tickets.length === 0 && <p className="text-sm text-slate-500">Queue is empty.</p>}
      </ul>
    </Card>
  );
}
