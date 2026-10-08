import { z } from "zod";

export const WorkTypeKeySchema = z.enum([
  "SEMINAR",
  "RESEARCH_PROJECT",
  "LITERATURE_REVIEW",
  "CASE_STUDY",
  "ESSAY",
  "ASSIGNMENT",
]);

export const CitationStyleSchema = z.enum([
  "APA_7",
  "MLA_9",
  "CHICAGO",
  "HARVARD",
  "VANCOUVER",
  "IEEE",
]);

export const createWorkspaceSchema = z.object({
  title: z.string().min(1, "Title is required.").max(200),
  workType: WorkTypeKeySchema,
  discipline: z.string().max(100).optional(),
  academicLevel: z.string().max(100).optional(),
  course: z.string().max(200).optional(),
  topic: z.string().min(1, "Topic is required.").max(2000),
  objectives: z.array(z.string().max(1000)).max(20).default([]),
  researchQuestions: z.array(z.string().max(1000)).max(20).default([]),
  hypotheses: z.array(z.string().max(1000)).max(20).default([]),
  citationStyle: CitationStyleSchema.default("APA_7"),
  instructions: z.string().max(10000).optional(),
  sourceYearFrom: z.number().int().min(1900).max(2100).nullable().optional(),
  sourceYearTo: z.number().int().min(1900).max(2100).nullable().optional(),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export const helperSchema = z.object({
  mode: z.enum(["topic-ideas", "refine-topic", "objectives", "alignment", "structure", "brief"]),
  input: z.string().min(1).max(5000),
  sectionTitle: z.string().max(300).optional(),
});

export const upsertSectionSchema = z.object({
  key: z.string().min(1).max(100),
  title: z.string().min(1).max(300),
  content: z.string().max(200000).default(""),
  order: z.number().int().min(0).max(1000).optional(),
});

export const updateProfileSchema = z.object({
  institution: z.string().max(200).optional(),
  faculty: z.string().max(200).optional(),
  department: z.string().max(200).optional(),
  programme: z.string().max(200).optional(),
  academicLevel: z.string().max(100).optional(),
  course: z.string().max(200).optional(),
  discipline: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  citationStyle: CitationStyleSchema.optional(),
  supervisor: z.string().max(200).optional(),
});
