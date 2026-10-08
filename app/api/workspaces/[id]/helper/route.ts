import { requireUser, requireWorkspace, success, error } from "@/lib/auth-session";
import { helperSchema } from "@/lib/validation/workspace";
import { runPipeline } from "@/lib/ai/pipeline";
import { loadWorkspaceContext } from "@/lib/ai/workspace-context";
import { buildBriefTask, type WorkTypeKey } from "@/lib/academic/work-types";
import { checkQuota, recordUsage } from "@/lib/billing/entitlement";
import { checkRateLimit, rateLimitedResponse } from "@/lib/security/rate-limit";

// Topic & Objectives Helper (workflow spec §2): advisory only. Suggestions are
// NEVER written to the workspace — the student accepts, edits, rejects, or
// ignores them in Main Build. Metered as AI generation (same quota/rate limit).
const MODE_TASKS: Record<string, (input: string, sectionTitle?: string) => string> = {
  "topic-ideas": (input) =>
    `Suggest 5 distinct, researchable topic ideas for this student interest: "${input}". ` +
    `For each: title, one-sentence scope, and why it is researchable. ` +
    `These are suggestions only — the student chooses their own approved topic.`,
  "refine-topic": (input) =>
    `Critique and refine this draft topic like a strict supervisor: "${input}". ` +
    `Point out vagueness, scope problems, and weak wording, then propose 2 tightened versions. ` +
    `Do not declare any version approved — the supervisor approves.`,
  objectives: (input) =>
    `Draft 3-5 SMART-style academic objectives for this topic/task: "${input}". ` +
    `Number them. Only propose objectives if the work genuinely needs them; ` +
    `if not, say so plainly instead of inventing filler.`,
  alignment: (input) =>
    `Check topic/objective alignment for: "${input}". ` +
    `For each objective state whether it serves the topic, is measurable, and is in scope — ` +
    `or flag it as misaligned with a concrete correction.`,
  structure: (input) =>
    `Propose a section structure for this work: "${input}". ` +
    `Return a numbered list of section titles only, with one short clause each on what it covers. ` +
    `Keep it appropriate to the work type — no filler sections.`,
  brief: (input, sectionTitle) =>
    buildBriefTask({
      sectionTitle: sectionTitle ?? "Untitled section",
      workType: "ESSAY",
      topic: input,
      objectives: [],
    }),
};

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
  const parsed = helperSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid helper request.", 400, parsed.error.flatten());
  }

  const quota = await checkQuota(result.user.id, "aiGenerations");
  if (!quota.allowed) {
    return error("USAGE_LIMIT", `AI generation limit reached (${quota.used}/${quota.limit} this period).`, 403);
  }
  const rl = await checkRateLimit("ai.generate", result.user.id);
  if (!rl.allowed) return rateLimitedResponse();

  const { context, workType } = await loadWorkspaceContext(id, result.user.id);
  const taskFn = MODE_TASKS[parsed.data.mode];
  const task =
    parsed.data.mode === "brief"
      ? buildBriefTask({
          sectionTitle: parsed.data.sectionTitle ?? "Untitled section",
          workType: workType as WorkTypeKey,
          topic: context.topic,
          objectives: context.objectives,
        })
      : taskFn(parsed.data.input, parsed.data.sectionTitle);

  const out = await runPipeline({
    workspaceId: id,
    userId: result.user.id,
    mode: "BUILD_WITH_ME",
    task,
    sectionTitle: parsed.data.sectionTitle,
    context,
  });

  if (out.status !== "ERROR" && out.status !== "BLOCKED") {
    await recordUsage(result.user.id, "ai.generation", 1, { workspaceId: id, helper: parsed.data.mode });
  }
  return success({ result: out }, out.status === "ERROR" ? 502 : 200);
}
