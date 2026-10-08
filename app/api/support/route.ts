import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, success, error } from "@/lib/auth-session";

const ticketSchema = z.object({
  category: z.string().min(1).max(100),
  subject: z.string().min(1).max(300),
  description: z.string().min(1).max(10000),
});

export async function GET() {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: result.user.id },
    orderBy: { createdAt: "desc" },
  });
  return success({ tickets });
}

export async function POST(request: Request) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("VALIDATION", "Invalid JSON body.", 400);
  }
  const parsed = ticketSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid ticket data.", 400, parsed.error.flatten());
  }
  const category = parsed.data.category.toLowerCase();
  if (["incorrect-ai-information", "incorrect-sources", "citation-problems"].includes(category)) {
    await prisma.userReport.create({
      data: {
        userId: result.user.id,
        kind: "AI_ISSUE",
        subject: parsed.data.subject,
        description: parsed.data.description,
      },
    });
  }
  const ticket = await prisma.supportTicket.create({
    data: { userId: result.user.id, ...parsed.data },
  });
  await prisma.usageEvent.create({ data: { userId: result.user.id, type: "support.create", count: 1 } });
  return success({ ticket }, 201);
}
