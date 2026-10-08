import { prisma } from "@/lib/db";
import { requireUser, requireWorkspace, success, error } from "@/lib/auth-session";
import { checkQuota, recordUsage } from "@/lib/billing/entitlement";
import { reviewContent } from "@/lib/reviewer/reviewer";
import { checkConsistency } from "@/lib/reviewer/consistency";
import { buildDocx } from "@/lib/export/docx";
import type { CitationStyle } from "@/lib/citations/format";

// Final check + DOCX export (PRD §47). Critical problems block with a report;
// PDF remains print-via-browser until server-side rendering lands.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const { id } = await params;
  const owned = await requireWorkspace(result.user.id, id);
  if ("response" in owned) return owned.response;

  const quota = await checkQuota(result.user.id, "exports");
  if (!quota.allowed) {
    return error("USAGE_LIMIT", `Export limit reached (${quota.used}/${quota.limit} this period).`, 403);
  }

  const [sections, evidenceCount, citations, references] = await Promise.all([
    prisma.section.findMany({ where: { workspaceId: id }, orderBy: { order: "asc" } }),
    prisma.evidenceItem.count({ where: { workspaceId: id } }),
    prisma.citation.count({ where: { workspaceId: id } }),
    prisma.workspaceSource.count({ where: { workspaceId: id } }),
  ]);

  const ws = owned.workspace;
  const allIssues = sections.flatMap((s) =>
    reviewContent({
      content: s.content,
      topic: ws.topic,
      objectives: (ws.objectives as string[]) ?? [],
      researchQuestions: (ws.researchQuestions as string[]) ?? [],
      evidenceCount,
      citationStyle: ws.citationStyle,
    })
  );
  const consistency = checkConsistency({
    topic: ws.topic,
    objectives: (ws.objectives as string[]) ?? [],
    researchQuestions: (ws.researchQuestions as string[]) ?? [],
    sections: sections.map((s) => ({ key: s.key, title: s.title, content: s.content })),
    citationCount: citations,
    referenceCount: references,
  });
  const critical = allIssues.filter((i) => i.severity === "CRITICAL");

  if (sections.length === 0) {
    return error("BLOCKED", "Nothing to export: no sections yet.", 422);
  }
  if (critical.length > 0) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "BLOCKED",
          message: `${critical.length} critical issue(s) must be resolved before export.`,
          issues: [...critical.map((c) => ({ severity: c.severity, dimension: c.dimension, message: c.message })), ...consistency],
        },
      },
      { status: 422 }
    );
  }

  const sources = await prisma.workspaceSource.findMany({
    where: { workspaceId: id },
    include: { source: true },
  });

  const buffer = await buildDocx({
    title: ws.title,
    topic: ws.topic,
    objectives: (ws.objectives as string[]) ?? [],
    sections: sections.map((s) => ({ title: s.title, content: s.content })),
    sources: sources.map((l) => ({
      title: l.source.title,
      authors: (l.source.authors as string[]) ?? [],
      year: l.source.year,
      publication: l.source.publication,
      doi: l.source.doi,
      url: l.source.url,
    })),
    citationStyle: ws.citationStyle as CitationStyle,
  });

  await recordUsage(result.user.id, "export.run", 1, { workspaceId: id, format: "docx" });
  const entry = { at: new Date().toISOString(), format: "docx", sections: sections.length };
  const history = Array.isArray(ws.exportHistory) ? ws.exportHistory : [];
  await prisma.workspace.update({
    where: { id },
    data: { exportHistory: [...history, entry] },
  });

  const filename = `${ws.title.replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 60) || "export"}.docx`;
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const { id } = await params;
  const owned = await requireWorkspace(result.user.id, id);
  if ("response" in owned) return owned.response;
  return success({ exportHistory: owned.workspace.exportHistory });
}
