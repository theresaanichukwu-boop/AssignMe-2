import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser, success, error } from "@/lib/auth-session";

function jsonObject(v: unknown): Prisma.InputJsonValue {
  if (v !== null && typeof v === "object") return v as Prisma.InputJsonValue;
  return {};
}

async function gate() {
  const result = await requireUser();
  if ("response" in result) return result;
  const role = (result.user.role ?? "STUDENT") as string;
  if (role !== "ADMIN" && role !== "CONTENT_MANAGER") {
    return { response: error("FORBIDDEN", "Insufficient permissions.", 403) as Response };
  }
  return { user: result.user };
}

export async function GET() {
  const g = await gate();
  if ("response" in g) return g.response;
  const disciplines = await prisma.discipline.findMany({
    include: { pack: true },
    orderBy: { name: "asc" },
  });
  const templates = await prisma.workTypeTemplate.findMany({ orderBy: { name: "asc" } });
  return success({ disciplines, templates });
}

const packSchema = z.object({
  disciplineId: z.string().min(1),
  pack: z.record(z.string(), z.unknown()),
});

export async function PATCH(request: Request) {
  const g = await gate();
  if ("response" in g) return g.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("VALIDATION", "Invalid JSON body.", 400);
  }
  const parsed = packSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid pack data.", 400, parsed.error.flatten());
  }
  const p = parsed.data.pack;
  const pack = await prisma.disciplinePack.upsert({
    where: { disciplineId: parsed.data.disciplineId },
    create: {
      disciplineId: parsed.data.disciplineId,
      terminology: jsonObject(p.terminology),
      conventions: jsonObject(p.conventions),
      structures: jsonObject(p.structures),
      methodologies: jsonObject(p.methodologies),
      frameworks: jsonObject(p.frameworks),
      evidencePrefs: jsonObject(p.evidencePrefs),
      commonErrors: jsonObject(p.commonErrors),
      reviewRules: jsonObject(p.reviewRules),
      writingNotes: jsonObject(p.writingNotes),
    },
    update: {
      terminology: jsonObject(p.terminology),
      conventions: jsonObject(p.conventions),
      structures: jsonObject(p.structures),
      methodologies: jsonObject(p.methodologies),
      frameworks: jsonObject(p.frameworks),
      evidencePrefs: jsonObject(p.evidencePrefs),
      commonErrors: jsonObject(p.commonErrors),
      reviewRules: jsonObject(p.reviewRules),
      writingNotes: jsonObject(p.writingNotes),
      version: { increment: 1 },
    },
  });
  await prisma.auditLog.create({
    data: { userId: g.user.id, action: "content.pack.update", meta: { disciplineId: parsed.data.disciplineId } },
  });
  return success({ pack });
}
