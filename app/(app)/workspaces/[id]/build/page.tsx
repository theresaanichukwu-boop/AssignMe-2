import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { BuildWorkspace } from "@/components/workspaces/BuildWorkspace";

export default async function BuildPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const workspace = await prisma.workspace.findFirst({
    where: { id, userId: session.user.id },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  if (!workspace) notFound();
  const template = await prisma.workTypeTemplate.findUnique({ where: { key: workspace.workType } });

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Build</h1>
      <p className="text-sm text-slate-500">
        Optional helper → Main Build (source of truth) → structure → brief → draft → editor.
      </p>
      <BuildWorkspace
        workspaceId={workspace.id}
        initial={{
          title: workspace.title,
          workType: workspace.workType,
          topic: workspace.topic,
          objectives: (workspace.objectives as string[]) ?? [],
          course: workspace.course,
          academicLevel: workspace.academicLevel,
          discipline: workspace.discipline,
          citationStyle: workspace.citationStyle,
          instructions: workspace.instructions ?? "",
          sourceYearFrom: workspace.sourceYearFrom,
          sourceYearTo: workspace.sourceYearTo,
        }}
        initialSections={workspace.sections.map((s) => ({
          id: s.id, key: s.key, title: s.title, content: s.content, order: s.order,
        }))}
        templateSections={((template?.structure as { sections?: string[] } | null)?.sections ?? [])}
      />
    </div>
  );
}
