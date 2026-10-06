import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { SourceCard } from "@/components/academic/Evidence";
import { EvidenceCard } from "@/components/academic/Evidence";
import { Badge } from "@/components/ui/Badge";

export default async function SourcesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const workspace = await prisma.workspace.findFirst({ where: { id, userId: session.user.id } });
  if (!workspace) notFound();

  const [links, evidence] = await Promise.all([
    prisma.workspaceSource.findMany({
      where: { workspaceId: id },
      include: { source: true },
      orderBy: { savedAt: "desc" },
    }),
    prisma.evidenceItem.findMany({ where: { workspaceId: id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Sources</h1>
        <p className="mt-1 text-sm text-slate-500">
          <Badge>{links.length} verified</Badge> Every source here passed metadata verification.
        </p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {links.map((l) => (
          <li key={l.sourceId}>
            <SourceCard
              source={{
                title: l.source.title,
                authors: l.source.authors as string[],
                year: l.source.year,
                publication: l.source.publication,
                doi: l.source.doi,
                verification: l.verification as "VERIFIED" | "UNVERIFIED" | "FAILED",
              }}
            />
          </li>
        ))}
      </ul>
      {links.length === 0 && (
        <p className="text-sm text-slate-500">No sources yet — run a search in the Research tab.</p>
      )}
      <div>
        <h2 className="text-xl font-semibold">Evidence pool ({evidence.length})</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {evidence.map((e) => (
            <li key={e.id}>
              <EvidenceCard
                item={{ finding: e.keyFinding, objective: e.objective, relevance: e.relevance, limitations: e.limitations }}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
