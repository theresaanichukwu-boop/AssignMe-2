import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, success, error } from "@/lib/auth-session";

export async function GET() {
  const result = await requireRole("ADMIN");
  if ("response" in result) return result.response;
  const configs = await prisma.featureConfiguration.findMany();
  return success({ configs });
}

const configSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.unknown(),
});

export async function PUT(request: Request) {
  const result = await requireRole("ADMIN");
  if ("response" in result) return result.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("VALIDATION", "Invalid JSON body.", 400);
  }
  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid configuration.", 400, parsed.error.flatten());
  }
  const config = await prisma.featureConfiguration.upsert({
    where: { key: parsed.data.key },
    create: { key: parsed.data.key, value: parsed.data.value as object },
    update: { value: parsed.data.value as object },
  });
  await prisma.auditLog.create({
    data: { userId: result.user.id, action: "admin.config.update", meta: { key: parsed.data.key } },
  });
  return success({ config });
}
