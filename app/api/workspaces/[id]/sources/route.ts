import { prisma } from "@/lib/db";
import { requireUser, requireWorkspace, success, error } from "@/lib/auth-session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const { id } = await params;
  const owned = await requireWorkspace(result.user.id, id);
  if ("response" in owned) return owned.response;
  const sources = await prisma.workspaceSource.findMany({
    where: { workspaceId: id },
    include: { source: true },
    orderBy: { savedAt: "desc" },
  });
  return success({ sources });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const { id } = await params;
  const owned = await requireWorkspace(result.user.id, id);
  if ("response" in owned) return owned.response;
  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get("sourceId");
  if (!sourceId) return error("VALIDATION", "sourceId is required.", 400);
  await prisma.workspaceSource.deleteMany({ where: { workspaceId: id, sourceId } });
  return success({ removed: true });
}
