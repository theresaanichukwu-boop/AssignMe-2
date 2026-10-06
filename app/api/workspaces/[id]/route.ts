import { prisma } from "@/lib/db";
import { requireUser, requireWorkspace, success, error } from "@/lib/auth-session";
import { updateWorkspaceSchema } from "@/lib/validation/workspace";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const { id } = await params;
  const owned = await requireWorkspace(result.user.id, id);
  if ("response" in owned) return owned.response;
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  return success({ workspace });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const { id } = await params;
  const owned = await requireWorkspace(result.user.id, id);
  if ("response" in owned) return owned.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("VALIDATION", "Invalid JSON body.", 400);
  }
  const parsed = updateWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid workspace data.", 400, parsed.error.flatten());
  }
  const workspace = await prisma.workspace.update({ where: { id }, data: parsed.data });
  return success({ workspace });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const { id } = await params;
  const owned = await requireWorkspace(result.user.id, id);
  if ("response" in owned) return owned.response;
  await prisma.workspace.delete({ where: { id } });
  return success({ deleted: true });
}
