import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { ExportPanel } from "@/components/workspaces/ExportPanel";

export default async function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const workspace = await prisma.workspace.findFirst({ where: { id, userId: session.user.id } });
  if (!workspace) notFound();

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Export</h1>
      <ExportPanel workspaceId={workspace.id} title={workspace.title} />
    </div>
  );
}
