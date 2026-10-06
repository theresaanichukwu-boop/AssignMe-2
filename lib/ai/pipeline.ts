// AI generation pipeline (PRD §§11–14):
// Validate → Load context → Generate → Clean → Validate citations →
// Review → Save → Display. Research failures never become fabrications.

import { prisma } from "@/lib/db";
import { generateContent, GeminiError } from "./gemini";
import { buildSystemInstruction, buildTaskPrompt, splitRationale, type WorkspaceContext } from "./context";
import { cleanOutput } from "./clean";

export type AIMode = "BUILD_WITH_ME" | "AUTOMATIC";
export type AIStatus = "DRAFT" | "VERIFIED" | "NEEDS_REVIEW" | "BLOCKED" | "ERROR";

export interface PipelineResult {
  status: AIStatus;
  answer: string;
  rationale: string | null;
  warnings: string[];
  nextStep: string | null;
  responseId: string | null;
}

export interface PipelineInput {
  workspaceId: string;
  userId: string;
  mode: AIMode;
  task: string;
  sectionTitle?: string;
  context: WorkspaceContext;
}

/** Automatic-mode stop conditions (PRD §11). Returns a block reason or null. */
export function automaticStopReason(input: { topic: string; task: string }): string | null {
  if (!input.topic.trim()) return "Required information is missing: topic.";
  if (input.task.length > 5000) return "Task is too broad for automatic mode; split into sections.";
  return null;
}

export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  if (!input.task.trim()) {
    return fail(input, "BLOCKED", "Task is empty.", "Describe the section to draft.");
  }
  if (input.mode === "AUTOMATIC") {
    const reason = automaticStopReason({ topic: input.context.topic, task: input.task });
    if (reason) return fail(input, "BLOCKED", reason, "Switch to Build With Me or supply the missing detail.");
  }
  if (!process.env.GEMINI_API_KEY) {
    return fail(input, "BLOCKED", "AI provider is not configured.", "Add GEMINI_API_KEY to generate drafts.");
  }

  const request = await prisma.aIRequest.create({
    data: { workspaceId: input.workspaceId, mode: input.mode, task: input.task },
  });

  try {
    const systemInstruction = buildSystemInstruction(input.context);
    const { text } = await generateContent({
      systemInstruction,
      userText: buildTaskPrompt(input.task, input.sectionTitle),
    });
    const { answer, rationale } = splitRationale(text);
    const cleaned = cleanOutput(answer);
    const warnings = [...cleaned.unsupportedClaims.map((c) => `Unsupported claim flagged: “${c.slice(0, 120)}…”`)];
    if (input.context.evidence.length === 0) {
      warnings.push("No verified evidence in the pool — output contains no citations by design.");
    }
    if (cleaned.removed.length > 0) {
      warnings.push(`Cleaned output (${cleaned.removed.join(", ")}).`);
    }

    const response = await prisma.aIResponse.create({
      data: {
        requestId: request.id,
        status: warnings.length > 0 ? "NEEDS_REVIEW" : "DRAFT",
        answer: cleaned.text,
        rationale,
        warnings,
        nextStep: "Review the draft, attach evidence, then save to the section.",
      },
    });
    return {
      status: response.status as AIStatus,
      answer: cleaned.text,
      rationale,
      warnings,
      nextStep: response.nextStep,
      responseId: response.id,
    };
  } catch (e) {
    const message = e instanceof GeminiError ? e.message : "AI generation failed.";
    await prisma.aIResponse.create({
      data: { requestId: request.id, status: "ERROR", answer: "", warnings: [message] },
    });
    // Student content is never at risk: nothing is written to sections here.
    return { status: "ERROR", answer: "", rationale: null, warnings: [message], nextStep: "Retry later.", responseId: null };
  }
}

async function fail(input: PipelineInput, status: AIStatus, warning: string, nextStep: string): Promise<PipelineResult> {
  const request = await prisma.aIRequest.create({
    data: { workspaceId: input.workspaceId, mode: input.mode, task: input.task },
  });
  const response = await prisma.aIResponse.create({
    data: { requestId: request.id, status, answer: "", warnings: [warning], nextStep },
  });
  return { status, answer: "", rationale: null, warnings: [warning], nextStep, responseId: response.id };
}
