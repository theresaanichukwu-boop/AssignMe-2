import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, requireWorkspace, success, error } from "@/lib/auth-session";
import { searchAll, defaultWindow } from "@/lib/research/providers";
import { checkQuota, recordUsage } from "@/lib/billing/entitlement";
import { checkRateLimit, rateLimitedResponse } from "@/lib/security/rate-limit";

const researchSchema = z.object({
  query: z.string().min(2).max(500),
  objective: z.string().max(1000).optional(),
  question: z.string().max(1000).optional(),
  limit: z.number().int().min(1).max(20).default(10),
});

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
  const parsed = researchSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid research request.", 400, parsed.error.flatten());
  }

  const quota = await checkQuota(result.user.id, "researchSearches");
  if (!quota.allowed) {
    return error("USAGE_LIMIT", `Research limit reached (${quota.used}/${quota.limit} this period).`, 403);
  }
  const rl = await checkRateLimit("research.search", result.user.id);
  if (!rl.allowed) return rateLimitedResponse();

  // Research failures are reported, never replaced with fabrications (PRD §43).
  // Year window comes from the student's Main Build choice (default: rolling 5 years).
  const defaults = defaultWindow();
  const window = {
    from: owned.workspace.sourceYearFrom ?? defaults.from,
    to: owned.workspace.sourceYearTo ?? defaults.to,
  };
  let found;
  try {
    found = await searchAll(parsed.data.query, parsed.data.limit, window);
  } catch {
    return error("UPSTREAM_ERROR", "Research providers unreachable. Try again later.", 502);
  }

  let saved = 0;
  for (const s of found) {
    const source = await prisma.source.upsert({
      where: s.doi ? { doi: s.doi } : { normalizedUrl: s.url ?? `nourl:${s.title}` },
      create: {
        title: s.title,
        authors: s.authors,
        year: s.year,
        publication: s.publication,
        doi: s.doi,
        url: s.url,
        abstract: s.abstract,
        sourceType: s.sourceType,
        provider: s.provider,
        verification: "VERIFIED",
      },
      update: { verification: "VERIFIED" },
    });
    const link = await prisma.workspaceSource.upsert({
      where: { workspaceId_sourceId: { workspaceId: id, sourceId: source.id } },
      create: { workspaceId: id, sourceId: source.id, verification: "VERIFIED" },
      update: {},
    });
    if (link) saved++;
  }
  await recordUsage(result.user.id, "research.search", 1, { workspaceId: id, query: parsed.data.query });

  return success({ results: found, saved, window }, 201);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const { id } = await params;
  const owned = await requireWorkspace(result.user.id, id);
  if ("response" in owned) return owned.response;
  const sources = await prisma.workspaceSource.findMany({
    where: { workspaceId: id },
    include: { source: true },
    orderBy: { savedAt: "desc" },
  });
  return success({ sources });
}
