import { z } from "zod";
import { formatCitation, validateCitable, type CitationStyle } from "@/lib/citations/format";
import { success, error } from "@/lib/auth-session";

const citationSchema = z.object({
  style: z.enum(["APA_7", "MLA_9", "CHICAGO", "HARVARD", "VANCOUVER", "IEEE"]),
  title: z.string(),
  authors: z.array(z.string()).default([]),
  year: z.number().int().nullable().default(null),
  publication: z.string().nullable().default(null),
  doi: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  index: z.number().int().min(1).default(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("VALIDATION", "Invalid JSON body.", 400);
  }
  const parsed = citationSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid citation data.", 400, parsed.error.flatten());
  }
  const source = { ...parsed.data };
  const problems = validateCitable(source);
  const formatted = formatCitation(parsed.data.style as CitationStyle, source, parsed.data.index);
  return success({ formatted, problems });
}
