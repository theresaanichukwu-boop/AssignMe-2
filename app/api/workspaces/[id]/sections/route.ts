import { prisma } from "@/lib/db";
import { requireUser, requireWorkspace, success, error } from "@/lib/auth-session";
import { upsertSectionSchema } from "@/lib/validation/workspace";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const { id } = await params;
  const owned = await requireWorkspace(result.user.id, id);
  if ("response" in owned) return owned.response;
  const sections = await prisma.section.findMany({
    where: { workspaceId: id },
    orderBy: { order: "asc" },
  });
  return success({ sections });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const parsed = upsertSectionSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid section data.", 400, parsed.error.flatten());
  }
  const existing = await prisma.section.findUnique({
    where: { workspaceId_key: { workspaceId: id, key: parsed.data.key } },
  });
  const order =
    parsed.data.order ??
    existing?.order ??
    (await prisma.section.count({ where: { workspaceId: id } }));
  const section = await prisma.section.upsert({
    where: { workspaceId_key: { workspaceId: id, key: parsed.data.key } },
    create: {
      workspaceId: id,
      key: parsed.data.key,
      title: parsed.data.title,
      content: parsed.data.content,
      order,
    },
    update: { title: parsed.data.title, content: parsed.data.content, order },
  });
  return success({ section }, existing ? 200 : 201);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const { id } = await params;
  const owned = await requireWorkspace(result.user.id, id);
  if ("response" in owned) return owned.response;
  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get("sectionId");
  if (!sectionId) return error("VALIDATION", "sectionId is required.", 400);
  const section = await prisma.section.findFirst({ where: { id: sectionId, workspaceId: id } });
  if (!section) return error("NOT_FOUND", "Section not found.", 404);
  await prisma.section.delete({ where: { id: sectionId } });
  return success({ deleted: true });
}
