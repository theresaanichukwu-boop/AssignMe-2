import { describe, expect, it } from "vitest";
import {
  WORK_TYPES,
  resolveObjectivesRequirement,
  defaultYearWindow,
  buildBriefTask,
  type WorkTypeKey,
} from "../lib/academic/work-types";
import { reviewStructure } from "../lib/reviewer/reviewer";

describe("work-type purpose (spec §1)", () => {
  it("defines a distinct purpose for all six work types", () => {
    const keys = Object.keys(WORK_TYPES);
    expect(keys).toHaveLength(6);
    const purposes = new Set(keys.map((k) => WORK_TYPES[k as WorkTypeKey].purpose));
    expect(purposes.size).toBe(6);
  });
});

describe("smart objective logic (spec §3)", () => {
  it("requires objectives for research projects", () => {
    const d = resolveObjectivesRequirement({ workType: "RESEARCH_PROJECT", topic: "t", instructions: "" });
    expect(d.needed).toBe(true);
  });

  it("usually skips objectives for assignments and essays", () => {
    for (const wt of ["ASSIGNMENT", "ESSAY"] as WorkTypeKey[]) {
      expect(resolveObjectivesRequirement({ workType: wt, topic: "t", instructions: "" }).needed).toBe(false);
    }
  });

  it("treats seminar, review, and case study as conditional", () => {
    for (const wt of ["SEMINAR", "LITERATURE_REVIEW", "CASE_STUDY"] as WorkTypeKey[]) {
      const d = resolveObjectivesRequirement({ workType: wt, topic: "general interest", instructions: "" });
      expect(d.needed).toBe(false);
      expect(d.reason).toBeTruthy();
    }
  });

  it("obeys explicit instructions over the baseline", () => {
    expect(
      resolveObjectivesRequirement({ workType: "ESSAY", topic: "t", instructions: "State your objectives clearly." }).needed
    ).toBe(true);
    expect(
      resolveObjectivesRequirement({ workType: "RESEARCH_PROJECT", topic: "t", instructions: "No objectives needed." }).needed
    ).toBe(false);
  });
});

describe("year window", () => {
  it("defaults to a rolling five-year span", () => {
    const w = defaultYearWindow(2026);
    expect(w).toEqual({ from: 2022, to: 2026 });
  });
});

describe("section brief (spec §6)", () => {
  it("builds a brief task naming the section and topic", () => {
    const task = buildBriefTask({ sectionTitle: "Methodology", workType: "RESEARCH_PROJECT", topic: "X", objectives: ["O1"] });
    expect(task).toMatch(/Methodology/);
    expect(task).toMatch(/O1/);
    expect(task).toMatch(/Do not draft/);
  });
});

describe("structure check (spec §10)", () => {
  it("flags a research project missing methodology", () => {
    const issues = reviewStructure("RESEARCH_PROJECT", [
      { key: "intro", title: "Introduction" },
      { key: "conclusion", title: "Conclusion" },
    ]);
    expect(issues.some((i) => i.dimension === "Structure" && /method/i.test(i.message))).toBe(true);
  });

  it("does not demand methodology from an essay", () => {
    const issues = reviewStructure("ESSAY", [
      { key: "intro", title: "Introduction" },
      { key: "argument", title: "Main argument" },
      { key: "conclusion", title: "Conclusion" },
    ]);
    expect(issues.length).toBe(0);
  });

  it("flags empty structures", () => {
    expect(reviewStructure("ESSAY", [])[0].severity).toBe("MAJOR");
  });
});
