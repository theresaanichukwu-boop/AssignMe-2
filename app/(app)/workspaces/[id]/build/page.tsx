import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { BuildPanel } from "@/components/workspaces/BuildPanel";

export default async function BuildPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const workspace = await prisma.workspace.findFirst({ where: { id, userId: session.user.id } });
  if (!workspace) notFound();

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Build</h1>
      <p className="text-sm text-slate-500">
        Structure first, then draft section by section. Nothing is written to your work without approval.
      </p>
      <BuildPanel workspaceId={workspace.id} />
    </div>
  );
}
