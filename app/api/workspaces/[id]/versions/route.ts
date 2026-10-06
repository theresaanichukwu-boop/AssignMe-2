import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, requireWorkspace, success, error } from "@/lib/auth-session";

const snapshotSchema = z.object({ sectionId: z.string().min(1) });
const restoreSchema = z.object({ sectionId: z.string().min(1), version: z.number().int().min(1) });

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const { id } = await params;
  const owned = await requireWorkspace(result.user.id, id);
  if ("response" in owned) return owned.response;
  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get("sectionId");
  const versions = await prisma.sectionVersion.findMany({
    where: { workspaceId: id, ...(sectionId ? { sectionId } : {}) },
    orderBy: { version: "desc" },
    take: 50,
  });
  return success({ versions });
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

  // Restore path: copy an old version's content into a new snapshot + live section.
  const restore = restoreSchema.safeParse(body);
  if (restore.success) {
    const target = await prisma.sectionVersion.findUnique({
      where: {
        sectionId_version: { sectionId: restore.data.sectionId, version: restore.data.version },
      },
    });
    if (!target || target.workspaceId !== id) {
      return error("NOT_FOUND", "Version not found.", 404);
    }
    const latest = await prisma.sectionVersion.findFirst({
      where: { sectionId: restore.data.sectionId },
      orderBy: { version: "desc" },
    });
    const next = (latest?.version ?? 0) + 1;
    await prisma.$transaction([
      prisma.section.update({
        where: { id: restore.data.sectionId },
        data: { content: target.content },
      }),
      prisma.sectionVersion.create({
        data: {
          sectionId: restore.data.sectionId,
          workspaceId: id,
          version: next,
          content: target.content,
          createdBy: result.user.id,
        },
      }),
    ]);
    return success({ restored: true, version: next });
  }

  const parsed = snapshotSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid version data.", 400, parsed.error.flatten());
  }
  const section = await prisma.section.findFirst({
    where: { id: parsed.data.sectionId, workspaceId: id },
  });
  if (!section) return error("NOT_FOUND", "Section not found.", 404);
  const latest = await prisma.sectionVersion.findFirst({
    where: { sectionId: section.id },
    orderBy: { version: "desc" },
  });
  const version = await prisma.sectionVersion.create({
    data: {
      sectionId: section.id,
      workspaceId: id,
      version: (latest?.version ?? 0) + 1,
      content: section.content,
      createdBy: result.user.id,
    },
  });
  return success({ version }, 201);
}
