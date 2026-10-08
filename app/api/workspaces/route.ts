import { prisma } from "@/lib/db";
import { requireUser, success, error } from "@/lib/auth-session";
import { createWorkspaceSchema } from "@/lib/validation/workspace";
import { checkQuota, recordUsage } from "@/lib/billing/entitlement";

export async function GET() {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const workspaces = await prisma.workspace.findMany({
    where: { userId: result.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, title: true, workType: true, discipline: true,
      topic: true, citationStyle: true, createdAt: true, updatedAt: true,
    },
  });
  return success({ workspaces });
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
  const parsed = createWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid workspace data.", 400, parsed.error.flatten());
  }
  const quota = await checkQuota(result.user.id, "workspaces");
  if (!quota.allowed) {
    return error("USAGE_LIMIT", `Workspace limit reached (${quota.used}/${quota.limit}). Upgrade for more.`, 403);
  }
  const workspace = await prisma.workspace.create({
    data: { userId: result.user.id, ...parsed.data },
  });
  await recordUsage(result.user.id, "workspace.create", 1, { workspaceId: workspace.id });
  return success({ workspace }, 201);
}
