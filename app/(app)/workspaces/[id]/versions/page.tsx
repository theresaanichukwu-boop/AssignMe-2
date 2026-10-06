import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { VersionsList } from "@/components/workspaces/VersionsList";

export default async function VersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const workspace = await prisma.workspace.findFirst({ where: { id, userId: session.user.id } });
  if (!workspace) notFound();

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Versions</h1>
      <p className="text-sm text-slate-500">
        Snapshots are immutable. Restoring creates a new version — nothing is lost.
      </p>
      <VersionsList workspaceId={workspace.id} />
    </div>
  );
}
