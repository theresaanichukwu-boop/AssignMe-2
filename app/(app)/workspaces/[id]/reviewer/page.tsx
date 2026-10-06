import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { ReviewerPanel } from "@/components/workspaces/ReviewerPanel";

export default async function ReviewerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const workspace = await prisma.workspace.findFirst({ where: { id, userId: session.user.id } });
  if (!workspace) notFound();

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Reviewer</h1>
      <p className="text-sm text-slate-500">
        Professor-style checks across relevance, structure, argument, evidence, and consistency —
        in evidence-based language, never false certainty.
      </p>
      <ReviewerPanel workspaceId={workspace.id} />
    </div>
  );
}
