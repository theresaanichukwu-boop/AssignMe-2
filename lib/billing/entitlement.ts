// Plans, trials, and quota enforcement (PRD §23).
// Limits are data (Plan.limits / FeatureConfiguration), never hard-coded.

import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type LimitKey =
  | "aiGenerations"
  | "researchSearches"
  | "reviews"
  | "workspaces"
  | "exports"
  | "storageMb";

export interface Entitlement {
  planKey: string;
  planName: string;
  trialing: boolean;
  limits: Record<LimitKey, number>;
}

const DEFAULT_FREE: Record<LimitKey, number> = {
  aiGenerations: 20,
  researchSearches: 10,
  reviews: 5,
  workspaces: 3,
  exports: 5,
  storageMb: 100,
};

export async function getEntitlement(userId: string): Promise<Entitlement> {
  const [trial, sub] = await Promise.all([
    prisma.trial.findFirst({ where: { userId, active: true }, orderBy: { endsAt: "desc" } }),
    prisma.subscription.findFirst({
      where: { userId, status: { in: ["ACTIVE", "TRIALING"] } },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const now = new Date();
  if (sub?.plan) {
    return {
      planKey: sub.plan.key,
      planName: sub.plan.name,
      trialing: sub.status === "TRIALING",
      limits: { ...DEFAULT_FREE, ...((sub.plan.limits as Record<string, number>) ?? {}) } as Record<LimitKey, number>,
    };
  }
  if (trial && trial.endsAt > now) {
    const trialPlan = await prisma.plan.findUnique({ where: { key: "TRIAL" } });
    if (trialPlan) {
      return {
        planKey: "TRIAL",
        planName: trialPlan.name,
        trialing: true,
        limits: { ...DEFAULT_FREE, ...((trialPlan.limits as Record<string, number>) ?? {}) } as Record<LimitKey, number>,
      };
    }
  }
  const free = await prisma.plan.findUnique({ where: { key: "FREE" } });
  return {
    planKey: "FREE",
    planName: free?.name ?? "Free",
    trialing: false,
    limits: { ...DEFAULT_FREE, ...(((free?.limits as Record<string, number> | null) ?? {})) } as Record<LimitKey, number>,
  };
}

const WINDOW_DAYS = 30;

function windowStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() - WINDOW_DAYS);
  return d;
}

/** Usage of metered event types in the rolling window. */
export async function usageInWindow(userId: string): Promise<Record<string, number>> {
  const events = await prisma.usageEvent.groupBy({
    by: ["type"],
    where: { userId, createdAt: { gte: windowStart() } },
    _sum: { count: true },
  });
  const out: Record<string, number> = {};
  for (const e of events) out[e.type] = e._sum.count ?? 0;
  return out;
}

export const EVENT_FOR_LIMIT: Record<LimitKey, string> = {
  aiGenerations: "ai.generation",
  researchSearches: "research.search",
  reviews: "review.run",
  workspaces: "workspace.create",
  exports: "export.run",
  storageMb: "storage.bytes",
};

export async function checkQuota(
  userId: string,
  limit: LimitKey,
  amount = 1
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const ent = await getEntitlement(userId);
  const usage = await usageInWindow(userId);
  const used = usage[EVENT_FOR_LIMIT[limit]] ?? 0;
  const max = ent.limits[limit] ?? 0;
  return { allowed: used + amount <= max, used, limit: max };
}

export async function recordUsage(userId: string, type: string, count = 1, meta: Prisma.InputJsonValue = {}) {
  await prisma.usageEvent.create({ data: { userId, type, count, meta } });
}

/** Start the one-month Premium trial if the user never had one. */
export async function ensureTrial(userId: string) {
  const existing = await prisma.trial.findFirst({ where: { userId } });
  if (existing) return existing;
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + 30);
  return prisma.trial.create({ data: { userId, endsAt } });
}
