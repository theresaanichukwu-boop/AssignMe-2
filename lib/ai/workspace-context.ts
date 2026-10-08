// Shared AI workspace-context loader: Main Build data is the source of truth.
// Used by generate + helper so both see the same topic, objectives policy,
// instructions, and year window.

import { prisma } from "@/lib/db";
import { WORK_TYPES, resolveObjectivesRequirement, defaultYearWindow, type WorkTypeKey } from "@/lib/academic/work-types";
import type { WorkspaceContext } from "./context";

export async function loadWorkspaceContext(
  workspaceId: string,
  userId: string
): Promise<{ context: WorkspaceContext; workType: WorkTypeKey }> {
  const ws = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  const workType = ws.workType as WorkTypeKey;
  const [template, pack, profile, evidence] = await Promise.all([
    prisma.workTypeTemplate.findUnique({ where: { key: ws.workType } }),
    prisma.disciplinePack.findFirst({ where: { discipline: { name: ws.discipline ?? "" } } }),
    prisma.studentProfile.findUnique({ where: { userId } }),
    prisma.evidenceItem.findMany({ where: { workspaceId }, take: 20 }),
  ]);

  const objectives = (ws.objectives as string[]) ?? [];
  const instructions = ws.instructions ?? "";
  const decision = resolveObjectivesRequirement({ workType, topic: ws.topic, instructions });
  const defaults = defaultYearWindow();

  const context: WorkspaceContext = {
    workType: ws.workType,
    workPurpose: WORK_TYPES[workType].purpose,
    discipline: ws.discipline,
    academicLevel: ws.academicLevel,
    course: ws.course,
    topic: ws.topic,
    objectives,
    objectivesNote: objectives.length > 0 ? "Student-approved objectives." : decision.reason,
    instructions,
    yearWindow: { from: ws.sourceYearFrom ?? defaults.from, to: ws.sourceYearTo ?? defaults.to },
    researchQuestions: (ws.researchQuestions as string[]) ?? [],
    citationStyle: ws.citationStyle,
    templateStructure: (template?.structure as unknown) ?? {},
    disciplinePack: (pack
      ? {
          terminology: pack.terminology,
          conventions: pack.conventions,
          methodologies: pack.methodologies,
          frameworks: pack.frameworks,
        }
      : null) as Record<string, unknown> | null,
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
  };
  return { context, workType };
}
