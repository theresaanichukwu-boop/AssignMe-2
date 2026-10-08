import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function AdminSubsPage() {
  const [subs, txs, trials] = await Promise.all([
    prisma.subscription.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { email: true } }, plan: true } }),
    prisma.paymentTransaction.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { email: true } } } }),
    prisma.trial.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { email: true } } } }),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Subscriptions & payments</h1>
      <Card title={`Subscriptions (${subs.length})`}>
        <ul className="mt-2 space-y-1 text-sm">
          {subs.map((s) => (
            <li key={s.id} className="flex justify-between gap-2">
              <span>{s.user.email} · {s.plan.name}</span>
              <Badge tone={s.status === "ACTIVE" ? "success" : "neutral"}>{s.status}</Badge>
            </li>
          ))}
          {subs.length === 0 && <li className="text-slate-500">None yet.</li>}
        </ul>
      </Card>
      <Card title={`Transactions (${txs.length})`}>
        <ul className="mt-2 space-y-1 font-mono text-xs">
          {txs.map((t) => (
            <li key={t.id} className="flex justify-between gap-2">
              <span>{t.paystackReference} · ₦{(t.amountKobo / 100).toLocaleString()}</span>
              <span>{t.status}</span>
            </li>
          ))}
          {txs.length === 0 && <li className="font-sans text-sm text-slate-500">None yet.</li>}
        </ul>
      </Card>
      <Card title={`Trials (${trials.length})`}>
        <ul className="mt-2 space-y-1 text-sm">
          {trials.map((t) => (
            <li key={t.id} className="flex justify-between gap-2">
              <span>{t.user.email}</span>
              <span className="text-slate-500">ends {new Date(t.endsAt).toLocaleDateString()} · {t.active ? "active" : "inactive"}</span>
            </li>
          ))}
          {trials.length === 0 && <li className="text-slate-500">None yet.</li>}
        </ul>
      </Card>
    </div>
  );
}
