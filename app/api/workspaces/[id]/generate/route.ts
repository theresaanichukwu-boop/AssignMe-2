import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, requireWorkspace, success, error } from "@/lib/auth-session";
import { runPipeline } from "@/lib/ai/pipeline";
import { checkQuota, recordUsage } from "@/lib/billing/entitlement";

const generateSchema = z.object({
  task: z.string().min(1).max(5000),
  sectionTitle: z.string().max(300).optional(),
  sectionKey: z.string().max(100).optional(),
  mode: z.enum(["BUILD_WITH_ME", "AUTOMATIC"]).default("BUILD_WITH_ME"),
  saveToSection: z.boolean().default(false),
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
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid generation request.", 400, parsed.error.flatten());
  }

  const quota = await checkQuota(result.user.id, "aiGenerations");
  if (!quota.allowed) {
    return error("USAGE_LIMIT", `AI generation limit reached (${quota.used}/${quota.limit} this period).`, 403);
  }

  const [template, pack, profile, evidence] = await Promise.all([
    prisma.workTypeTemplate.findUnique({ where: { key: owned.workspace.workType } }),
    prisma.disciplinePack.findFirst({
      where: { discipline: { name: owned.workspace.discipline ?? "" } },
    }),
    prisma.studentProfile.findUnique({ where: { userId: result.user.id } }),
    prisma.evidenceItem.findMany({ where: { workspaceId: id }, take: 20 }),
  ]);

  const out = await runPipeline({
    workspaceId: id,
    userId: result.user.id,
    mode: parsed.data.mode,
    task: parsed.data.task,
    sectionTitle: parsed.data.sectionTitle,
    context: {
      workType: owned.workspace.workType,
      discipline: owned.workspace.discipline,
      academicLevel: owned.workspace.academicLevel,
      course: owned.workspace.course,
      topic: owned.workspace.topic,
      objectives: (owned.workspace.objectives as string[]) ?? [],
      researchQuestions: (owned.workspace.researchQuestions as string[]) ?? [],
      citationStyle: owned.workspace.citationStyle,
      templateStructure: (template?.structure as unknown) ?? {},
      disciplinePack: (pack ? {
        terminology: pack.terminology, conventions: pack.conventions,
        methodologies: pack.methodologies, frameworks: pack.frameworks,
      } : null) as Record<string, unknown> | null,
      profile: {
        institution: profile?.institution ?? null,
        level: profile?.academicLevel ?? null,
        course: profile?.course ?? null,
      },
      evidence: evidence.map((e) => ({
        finding: e.keyFinding,
        objective: e.objective,
        citationText: e.citationText,
        limitations: e.limitations,
      })),
    },
  });

  // Generation never writes to sections directly; explicit save only.
  if (parsed.data.saveToSection && parsed.data.sectionKey && out.answer) {
    const existing = await prisma.section.findUnique({
      where: { workspaceId_key: { workspaceId: id, key: parsed.data.sectionKey } },
    });
    await prisma.section.upsert({
      where: { workspaceId_key: { workspaceId: id, key: parsed.data.sectionKey } },
      create: {
        workspaceId: id,
        key: parsed.data.sectionKey,
        title: parsed.data.sectionTitle ?? parsed.data.sectionKey,
        content: out.answer,
        order: await prisma.section.count({ where: { workspaceId: id } }),
      },
      update: { content: out.answer },
    });
    if (existing) {
      const latest = await prisma.sectionVersion.findFirst({
        where: { sectionId: existing.id },
        orderBy: { version: "desc" },
      });
      await prisma.sectionVersion.create({
        data: {
          sectionId: existing.id, workspaceId: id,
          version: (latest?.version ?? 0) + 1,
          content: out.answer, createdBy: result.user.id,
        },
      });
    }
  }

  if (out.status !== "ERROR" && out.status !== "BLOCKED") {
    await recordUsage(result.user.id, "ai.generation", 1, { workspaceId: id });
  }

  return success({ result: out }, out.status === "ERROR" ? 502 : 200);
}
