import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, requireWorkspace, success, error } from "@/lib/auth-session";
import { reviewContent, reviewStructure } from "@/lib/reviewer/reviewer";
import type { WorkTypeKey } from "@/lib/academic/work-types";
import { checkConsistency } from "@/lib/reviewer/consistency";
import { checkQuota, recordUsage } from "@/lib/billing/entitlement";
import { checkRateLimit, rateLimitedResponse } from "@/lib/security/rate-limit";

const reviewSchema = z.object({ sectionId: z.string().min(1) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const { id } = await params;
  const owned = await requireWorkspace(result.user.id, id);
  if ("response" in owned) return owned.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("VALIDATION", "Invalid JSON body.", 400);
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid review request.", 400, parsed.error.flatten());
  }

  const quota = await checkQuota(result.user.id, "reviews");
  if (!quota.allowed) {
    return error("USAGE_LIMIT", `Review limit reached (${quota.used}/${quota.limit} this period).`, 403);
  }
  const rl = await checkRateLimit("review.run", result.user.id);
  if (!rl.allowed) return rateLimitedResponse();

  const section = await prisma.section.findFirst({
    where: { id: parsed.data.sectionId, workspaceId: id },
  });
  if (!section) return error("NOT_FOUND", "Section not found.", 404);

  const [evidenceCount, sections, citations, references] = await Promise.all([
    prisma.evidenceItem.count({ where: { workspaceId: id } }),
    prisma.section.findMany({ where: { workspaceId: id }, orderBy: { order: "asc" } }),
    prisma.citation.count({ where: { workspaceId: id } }),
    prisma.workspaceSource.count({ where: { workspaceId: id } }),
  ]);

  const issues = reviewContent({
    content: section.content,
    topic: owned.workspace.topic,
    objectives: (owned.workspace.objectives as string[]) ?? [],
    researchQuestions: (owned.workspace.researchQuestions as string[]) ?? [],
    evidenceCount,
    citationStyle: owned.workspace.citationStyle,
  });

  const consistency = checkConsistency({
    topic: owned.workspace.topic,
    objectives: (owned.workspace.objectives as string[]) ?? [],
    researchQuestions: (owned.workspace.researchQuestions as string[]) ?? [],
    sections: sections.map((s) => ({ key: s.key, title: s.title, content: s.content })),
    citationCount: citations,
    referenceCount: references,
  });

  const structure = reviewStructure(
    owned.workspace.workType as WorkTypeKey,
    sections.map((s) => ({ key: s.key, title: s.title }))
  );

  const review = await prisma.review.create({
    data: {
      workspaceId: id,
      sectionId: section.id,
      summary: `${issues.length} issue(s), ${consistency.length} consistency note(s), ${structure.length} structure note(s).`,
      issues: {
        create: [
          ...issues.map((i) => ({ severity: i.severity, dimension: i.dimension, message: i.message })),
          ...consistency.map((c) => ({ severity: "MODERATE" as const, dimension: "Consistency", message: c.message })),
          ...structure.map((s) => ({ severity: s.severity, dimension: s.dimension, message: s.message })),
        ],
      },
    },
    include: { issues: true },
  });
  await recordUsage(result.user.id, "review.run", 1, { workspaceId: id, sectionId: section.id });

  return success({ review }, 201);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const { id } = await params;
  const owned = await requireWorkspace(result.user.id, id);
  if ("response" in owned) return owned.response;
  const reviews = await prisma.review.findMany({
    where: { workspaceId: id },
    include: { issues: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return success({ reviews });
}
