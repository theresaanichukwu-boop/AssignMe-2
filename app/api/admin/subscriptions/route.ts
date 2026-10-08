import { prisma } from "@/lib/db";
import { requireRole, success } from "@/lib/auth-session";

export async function GET() {
  const result = await requireRole("ADMIN");
  if ("response" in result) return result.response;
  const [subscriptions, transactions, trials] = await Promise.all([
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { email: true } }, plan: true },
    }),
    prisma.paymentTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { email: true } } },
    }),
    prisma.trial.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  return success({ subscriptions, transactions, trials });
}
