import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default async function MyWorkPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const workspaces = await prisma.workspace.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AppShell title="My Work" sidebarActive="My Work">
      <div className="flex justify-end">
        <a href="/workspaces/new">
          <Button>Create workspace</Button>
        </a>
      </div>
      {workspaces.length === 0 ? (
        <Card title="No workspaces yet">
          <p className="mt-2 text-sm text-slate-500">
            Create your first workspace to begin.
          </p>
        </Card>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {workspaces.map((w) => (
            <li key={w.id}>
              <Card title={w.title}>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{w.workType.replace(/_/g, " ")}</Badge>
                  {w.discipline && <Badge tone="info">{w.discipline}</Badge>}
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{w.topic}</p>
                <a href={`/workspaces/${w.id}/overview`} className="mt-3 inline-block text-sm font-medium text-teal-800 hover:underline">
                  Open workspace →
                </a>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
