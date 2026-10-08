import { prisma } from "@/lib/db";
import { requireRole, success } from "@/lib/auth-session";

export async function GET() {
  const result = await requireRole("ADMIN");
  if ("response" in result) return result.response;
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const usage = await prisma.usageEvent.groupBy({
    by: ["type"],
    _sum: { count: true },
    _count: true,
  });
  return success({ logs, usage });
}
