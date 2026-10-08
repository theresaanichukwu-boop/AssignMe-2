import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, success, error } from "@/lib/auth-session";

async function gate() {
  const result = await requireUser();
  if ("response" in result) return result;
  const role = ((result.user.role ?? "STUDENT") as string) as "ADMIN" | "SUPPORT" | "STUDENT" | "CONTENT_MANAGER";
  if (role !== "ADMIN" && role !== "SUPPORT") {
    return { response: error("FORBIDDEN", "Insufficient permissions.", 403) as Response };
  }
  return { user: result.user, role };
}

export async function GET() {
  const g = await gate();
  if ("response" in g) return g.response;
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { email: true } } },
  });
  return success({ tickets });
}

const updateSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
});

export async function PATCH(request: Request) {
  const g = await gate();
  if ("response" in g) return g.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("VALIDATION", "Invalid JSON body.", 400);
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid ticket update.", 400, parsed.error.flatten());
  }
  const ticket = await prisma.supportTicket.update({
    where: { id: parsed.data.ticketId },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.priority ? { priority: parsed.data.priority } : {}),
      ...(parsed.data.assigneeId !== undefined ? { assigneeId: parsed.data.assigneeId } : {}),
    },
  });
  await prisma.auditLog.create({
    data: { userId: g.user.id, action: "support.ticket.update", meta: { ticketId: ticket.id, status: ticket.status } },
  });
  return success({ ticket });
}
