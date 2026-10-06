import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const [workspaceCount, recent] = await Promise.all([
    prisma.workspace.count({ where: { userId: session.user.id } }),
    prisma.workspace.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, workType: true, updatedAt: true },
    }),
  ]);

  return (
    <AppShell title="Dashboard" sidebarActive="Dashboard">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-slate-600">
          Welcome{session.user.name ? `, ${session.user.name}` : ""} —{" "}
          {workspaceCount} workspace{workspaceCount === 1 ? "" : "s"}.
        </p>
        <a href="/workspaces/new">
          <Button>Create workspace</Button>
        </a>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card title="Recent work">
          {recent.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              No workspaces yet. Create one to start the Understand → Clarify → Structure flow.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {recent.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-3 text-sm">
                  <a href={`/workspaces/${w.id}/overview`} className="font-medium text-teal-800 hover:underline">
                    {w.title}
                  </a>
                  <span className="text-xs text-slate-500">{w.workType.replace(/_/g, " ")}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Workflow">
          <p className="mt-2 text-sm text-slate-600">
            Understand → Clarify → Structure → Research → Evaluate → Draft → Review → Improve →
            Final check → Export
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Major work is generated section by section with your approval at each academic decision.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
