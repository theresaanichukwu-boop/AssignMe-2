// Work-type academic intelligence (workflow spec §§1, 3, 5, 10).
// Purpose, objectives policy, and structure expectations per work type.
// Structure itself stays in WorkTypeTemplate (DB); this module adds meaning.

export type WorkTypeKey =
  | "SEMINAR"
  | "RESEARCH_PROJECT"
  | "LITERATURE_REVIEW"
  | "CASE_STUDY"
  | "ESSAY"
  | "ASSIGNMENT";

export type ObjectivesPolicy = "required" | "optional" | "usually-not";

export interface WorkTypeConfig {
  key: WorkTypeKey;
  purpose: string;
  objectivesPolicy: ObjectivesPolicy;
  policyNote: string;
  /** Keywords expected in section titles for the structure check. */
  expectedSections: string[][];
}

export const WORK_TYPES: Record<WorkTypeKey, WorkTypeConfig> = {
  RESEARCH_PROJECT: {
    key: "RESEARCH_PROJECT",
    purpose:
      "Original investigation answering research questions through methodology, evidence, and analysis.",
    objectivesPolicy: "required",
    policyNote: "Objectives normally required — they anchor methodology, results, and conclusions.",
    expectedSections: [["introduction"], ["literature", "review"], ["method"], ["result", "finding"], ["discussion", "conclusion"]],
  },
  SEMINAR: {
    key: "SEMINAR",
    purpose:
      "Structured presentation of a topic: background, discussion of evidence, conclusions and recommendations.",
    objectivesPolicy: "optional",
    policyNote: "Objectives may be required depending on institutional requirements — include them when stated.",
    expectedSections: [["introduction"], ["objective"], ["background", "discussion"], ["conclusion"], ["recommend"]],
  },
  ASSIGNMENT: {
    key: "ASSIGNMENT",
    purpose:
      "Direct response to a set question, driven by its command words (define, discuss, evaluate…).",
    objectivesPolicy: "usually-not",
    policyNote: "Usually no formal objectives — answer the question as asked unless required.",
    expectedSections: [["introduction"], ["conclusion"]],
  },
  ESSAY: {
    key: "ESSAY",
    purpose:
      "Sustained argument for a thesis, with evidence, analysis, and counterargument where appropriate.",
    objectivesPolicy: "usually-not",
    policyNote: "Usually no formal objectives — the thesis carries the argument unless required.",
    expectedSections: [["introduction"], ["thesis", "argument", "discussion"], ["conclusion"]],
  },
  LITERATURE_REVIEW: {
    key: "LITERATURE_REVIEW",
    purpose:
      "Critical synthesis of existing evidence: themes, comparisons, gaps — not source-by-source summary.",
    objectivesPolicy: "optional",
    policyNote: "Objectives may be appropriate depending on the review question and task.",
    expectedSections: [["question"], ["search", "strategy", "method"], ["theme", "synthesis", "finding"], ["gap"], ["conclusion"]],
  },
  CASE_STUDY: {
    key: "CASE_STUDY",
    purpose:
      "Analysis of a real case: context, evidence, framework-based analysis, options, and recommendation.",
    objectivesPolicy: "optional",
    policyNote: "Objectives only when appropriate to the case and task.",
    expectedSections: [["background", "case", "context"], ["analysis", "evidence"], ["option", "evaluat"], ["recommend"], ["conclusion"]],
  },
};

export interface ObjectivesDecision {
  needed: boolean;
  reason: string;
}

/**
 * Smart objective logic (§3): work type baseline, refined by topic,
 * task/instructions, and academic context — never a blind list.
 */
export function resolveObjectivesRequirement(input: {
  workType: WorkTypeKey;
  topic: string;
  instructions: string;
}): ObjectivesDecision {
  const policy = WORK_TYPES[input.workType].objectivesPolicy;
  const text = `${input.topic} ${input.instructions}`.toLowerCase();

  const explicitlyRequired =
    /\bobjectives?\s+(are\s+)?required\b/.test(text) ||
    /\bstate\s+your\s+objectives?\b/.test(text) ||
    /\blist\s+\d*\s*objectives?\b/.test(text);
  const explicitlyExcluded =
    /\bno\s+objectives?\b/.test(text) || /\bobjectives?\s+not\s+required\b/.test(text);

  if (explicitlyRequired && !explicitlyExcluded) {
    return { needed: true, reason: "Your instructions explicitly require objectives." };
  }
  if (explicitlyExcluded) {
    return { needed: false, reason: "Your instructions state objectives are not required." };
  }

  switch (policy) {
    case "required":
      return { needed: true, reason: WORK_TYPES[input.workType].policyNote };
    case "optional": {
      const hints = /objective|aim|purpose|investigat|compar|evaluat|assess/.test(text);
      return hints
        ? { needed: true, reason: "Your topic/task suggests objectives would strengthen the work." }
        : { needed: false, reason: `${WORK_TYPES[input.workType].policyNote} None detected in your task — you can add them anyway.` };
    }
    case "usually-not":
      return { needed: false, reason: WORK_TYPES[input.workType].policyNote };
  }
}

/** Rolling default source-year window (overridable per workspace). */
export function defaultYearWindow(now = new Date().getFullYear()): { from: number; to: number } {
  return { from: now - 4, to: now };
}

/** Professor-style section brief prompt (spec §6). */
export function buildBriefTask(params: {
  sectionTitle: string;
  workType: WorkTypeKey;
  topic: string;
  objectives: string[];
}): string {
  const purpose = WORK_TYPES[params.workType].purpose;
  return [
    `Write a concise professor-style brief (4-6 sentences) for the section "${params.sectionTitle}".`,
    `Work purpose: ${purpose}. Approved topic: ${params.topic}.`,
    params.objectives.length > 0
      ? `Objectives it must serve: ${params.objectives.join(" | ")}.`
      : `No formal objectives for this work — serve the topic and work purpose directly.`,
    "Explain what the section must accomplish, what good looks like, and what to avoid. Do not draft the section content.",
  ].join(" ");
}
