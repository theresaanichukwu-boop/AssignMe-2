import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { NewWorkspaceForm } from "@/components/workspaces/NewWorkspaceForm";

export default async function NewWorkspacePage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const disciplines = await prisma.discipline.findMany({ orderBy: { name: "asc" } });

  return (
    <AppShell title="Create Workspace" sidebarActive="Create Workspace">
      <Card title="New workspace">
        <div className="mt-4">
          <NewWorkspaceForm disciplines={disciplines.map((d) => d.name)} />
        </div>
      </Card>
    </AppShell>
  );
}
