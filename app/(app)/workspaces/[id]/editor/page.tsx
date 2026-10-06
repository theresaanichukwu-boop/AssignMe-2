import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { SectionEditor } from "@/components/workspaces/SectionEditor";

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const workspace = await prisma.workspace.findFirst({ where: { id, userId: session.user.id } });
  if (!workspace) notFound();

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Editor</h1>
      <p className="text-sm text-slate-500">
        Every save snapshots a version. Restore earlier versions from the Versions tab.
      </p>
      <SectionEditor workspaceId={workspace.id} />
    </div>
  );
}
