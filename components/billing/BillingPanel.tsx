"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface BillingData {
  entitlement: { planKey: string; planName: string; trialing: boolean; limits: Record<string, number> };
  usage: Record<string, number>;
  plans: Array<{ key: string; name: string; limits: Record<string, number>; priceKobo: number }>;
  trial: { endsAt: string } | null;
  paystackConfigured: boolean;
}

export function BillingPanel() {
  const [data, setData] = useState<BillingData | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/billing")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setData(j.data);
      })
      .catch(() => undefined);
  }, []);

  async function subscribe() {
    setLoading(true);
    setStatus("");
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planKey: "PREMIUM" }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setStatus(json.error?.message ?? "Could not start payment.");
      return;
    }
    window.location.href = json.data.authorizationUrl;
  }

  if (!data) return <p className="text-sm text-slate-500">Loading billing…</p>;

  return (
    <div className="space-y-4">
      <Card title="Current plan">
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone="accent">{data.entitlement.planName}</Badge>
          {data.entitlement.trialing && <Badge tone="info">Trial</Badge>}
          {data.trial && <span className="text-xs text-slate-500">Trial ends {new Date(data.trial.endsAt).toLocaleDateString()}</span>}
        </div>
        <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
          {Object.entries(data.entitlement.limits).map(([k, v]) => (
            <li key={k} className="flex justify-between gap-2">
              <span className="text-slate-500">{k}</span>
              <span>
                {data.usage[k] ?? data.usage[({ aiGenerations: "ai.generation", researchSearches: "research.search", reviews: "review.run", workspaces: "workspace.create", exports: "export.run", storageMb: "storage.bytes" } as Record<string, string>)[k]] ?? 0} / {v}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {data.plans.map((p) => (
          <Card key={p.key} title={p.name}>
            <p className="mt-1 font-serif text-2xl">
              {p.priceKobo === 0 ? "Free" : `₦${(p.priceKobo / 100).toLocaleString()}/mo`}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-500">
              {Object.entries(p.limits as Record<string, number>).map(([k, v]) => (
                <li key={k}>
                  {k}: {v}
                </li>
              ))}
            </ul>
            {p.key === "PREMIUM" && data.entitlement.planKey !== "PREMIUM" && (
              <div className="mt-3">
                <Button loading={loading} disabled={!data.paystackConfigured} onClick={() => void subscribe()}>
                  Upgrade with Paystack
                </Button>
                {!data.paystackConfigured && (
                  <p className="mt-1 text-xs text-amber-700">Payments not configured yet (test mode pending).</p>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
      {status && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {status}
        </p>
      )}
    </div>
  );
}
