import { describe, expect, it } from "vitest";
import {
  createWorkspaceSchema,
  updateProfileSchema,
  upsertSectionSchema,
} from "../lib/validation/workspace";

describe("workspace validation", () => {
  it("accepts a valid workspace payload", () => {
    const parsed = createWorkspaceSchema.safeParse({
      title: "My essay",
      workType: "ESSAY",
      topic: "Climate policy in West Africa",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown work types", () => {
    const parsed = createWorkspaceSchema.safeParse({
      title: "x",
      workType: "BLOG_POST",
      topic: "y",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty topic", () => {
    const parsed = createWorkspaceSchema.safeParse({
      title: "x",
      workType: "ESSAY",
      topic: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts partial profile updates", () => {
    const parsed = updateProfileSchema.safeParse({ institution: "UNILAG" });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid citation style", () => {
    const parsed = updateProfileSchema.safeParse({ citationStyle: "OXFORD" });
    expect(parsed.success).toBe(false);
  });

  it("accepts a valid section payload", () => {
    const parsed = upsertSectionSchema.safeParse({
      key: "introduction",
      title: "Introduction",
      content: "Hello",
    });
    expect(parsed.success).toBe(true);
  });
});
