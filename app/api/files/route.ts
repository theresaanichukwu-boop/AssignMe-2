import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, success, error } from "@/lib/auth-session";
import { presignedUploadUrl, presignedDownloadUrl, storageConfigured, MAX_FILE_MB } from "@/lib/storage/r2";

const completeSchema = z.object({
  key: z.string().min(1).max(300),
  filename: z.string().min(1).max(200),
  mimeType: z.string().min(1).max(200),
  sizeBytes: z.number().int().min(1).max(MAX_FILE_MB * 1024 * 1024),
});

export async function GET(request: Request) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key) {
    const files = await prisma.fileObject.findMany({
      where: { userId: result.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return success({ files });
  }
  const file = await prisma.fileObject.findFirst({ where: { r2Key: key, userId: result.user.id } });
  if (!file) return error("NOT_FOUND", "File not found.", 404);
  if (!storageConfigured()) return error("SETUP", "Storage is not configured.", 503);
  return success({ downloadUrl: await presignedDownloadUrl(key) });
}

export async function POST(request: Request) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  if (!storageConfigured()) return error("SETUP", "Storage is not configured yet.", 503);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("VALIDATION", "Invalid JSON body.", 400);
  }
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid file data.", 400, parsed.error.flatten());
  }
  try {
    const { key, url } = await presignedUploadUrl({ userId: result.user.id, ...parsed.data });
    const file = await prisma.fileObject.create({
      data: {
        userId: result.user.id,
        r2Key: key,
        filename: parsed.data.filename,
        mimeType: parsed.data.mimeType,
        sizeBytes: parsed.data.sizeBytes,
      },
    });
    return success({ file, uploadUrl: url }, 201);
  } catch (e) {
    return error("VALIDATION", (e as Error).message, 400);
  }
}
