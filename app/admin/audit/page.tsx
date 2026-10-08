import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";

export default async function AdminAuditPage() {
  const [logs, usage, templates, configs] = await Promise.all([
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.usageEvent.groupBy({ by: ["type"], _sum: { count: true } }),
    prisma.workTypeTemplate.findMany({ orderBy: { name: "asc" } }),
    prisma.featureConfiguration.findMany(),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Audit & usage</h1>
      <Card title="Product events (§48)">
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          {usage.map((u) => (
            <li key={u.type} className="flex justify-between gap-2">
              <span className="font-mono text-xs">{u.type}</span>
              <span>{u._sum.count ?? 0}</span>
            </li>
          ))}
          {usage.length === 0 && <li className="text-slate-500">No events yet.</li>}
        </ul>
      </Card>
      <Card title="Work-type templates">
        <ul className="mt-2 space-y-1 text-sm">
          {templates.map((t) => (
            <li key={t.id}>
              {t.name} <span className="text-slate-500">· v{t.version}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Feature configuration">
        <ul className="mt-2 space-y-1 font-mono text-xs">
          {configs.map((c) => (
            <li key={c.id}>
              {c.key}: {JSON.stringify(c.value).slice(0, 120)}
            </li>
          ))}
        </ul>
      </Card>
      <Card title={`Audit log (${logs.length})`}>
        <ul className="mt-2 space-y-1 font-mono text-xs">
          {logs.map((l) => (
            <li key={l.id}>
              {new Date(l.createdAt).toLocaleString()} · {l.action} · {l.userId ?? "system"}
            </li>
          ))}
          {logs.length === 0 && <li className="font-sans text-sm text-slate-500">No entries yet.</li>}
        </ul>
      </Card>
    </div>
  );
}
