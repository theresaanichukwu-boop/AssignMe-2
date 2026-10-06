import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, requireWorkspace, success, error } from "@/lib/auth-session";

const evidenceSchema = z.object({
  sourceId: z.string().optional(),
  objective: z.string().max(1000).optional(),
  question: z.string().max(1000).optional(),
  keyFinding: z.string().min(1).max(5000),
  evidenceType: z.string().max(200).optional(),
  relevance: z.string().max(1000).optional(),
  limitations: z.string().max(2000).optional(),
  citationText: z.string().max(2000).optional(),
  studentNotes: z.string().max(5000).optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const { id } = await params;
  const owned = await requireWorkspace(result.user.id, id);
  if ("response" in owned) return owned.response;
  const evidence = await prisma.evidenceItem.findMany({
    where: { workspaceId: id },
    include: { source: true },
    orderBy: { createdAt: "desc" },
  });
  return success({ evidence });
}

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
  const parsed = evidenceSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid evidence data.", 400, parsed.error.flatten());
  }
  const item = await prisma.evidenceItem.create({
    data: { workspaceId: id, ...parsed.data },
  });
  return success({ evidence: item }, 201);
}
