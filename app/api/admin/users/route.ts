import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, success, error } from "@/lib/auth-session";

export async function GET() {
  const result = await requireRole("ADMIN");
  if ("response" in result) return result.response;
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return success({ users });
}

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["STUDENT", "ADMIN", "CONTENT_MANAGER", "SUPPORT"]),
});

export async function PATCH(request: Request) {
  const result = await requireRole("ADMIN");
  if ("response" in result) return result.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("VALIDATION", "Invalid JSON body.", 400);
  }
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid role data.", 400, parsed.error.flatten());
  }
  if (parsed.data.userId === result.user.id) {
    return error("CONFLICT", "You cannot change your own role.", 409);
  }
  const user = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
    select: { id: true, email: true, role: true },
  });
  await prisma.auditLog.create({
    data: { userId: result.user.id, action: "admin.role.change", meta: { target: user.id, role: user.role } },
  });
  return success({ user });
}
