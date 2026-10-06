import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function OverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const workspace = await prisma.workspace.findFirst({
    where: { id, userId: session.user.id },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  if (!workspace) notFound();

  const objectives = workspace.objectives as string[];
  const questions = workspace.researchQuestions as string[];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap gap-2">
          <Badge>{workspace.workType.replace(/_/g, " ")}</Badge>
          {workspace.discipline && <Badge tone="info">{workspace.discipline}</Badge>}
          <Badge tone="accent">{workspace.citationStyle.replace("_", " ")}</Badge>
        </div>
        <h1 className="mt-2 font-serif text-3xl">{workspace.title}</h1>
        <p className="mt-2 text-slate-600">{workspace.topic}</p>
      </div>
      <Card title="Objectives">
        {objectives.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No objectives recorded yet.</p>
        ) : (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Research questions">
        {questions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No research questions recorded yet.</p>
        ) : (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        )}
      </Card>
      <Card title={`Sections (${workspace.sections.length})`}>
        {workspace.sections.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No sections yet — add them from the Editor tab.
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {workspace.sections.map((s) => (
              <li key={s.id}>
                <a href={`/workspaces/${workspace.id}/editor`} className="text-teal-800 hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
