import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { ResearchPanel } from "@/components/workspaces/ResearchPanel";

export default async function ResearchPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const workspace = await prisma.workspace.findFirst({ where: { id, userId: session.user.id } });
  if (!workspace) notFound();

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Research</h1>
      <ResearchPanel workspaceId={workspace.id} />
    </div>
  );
}
