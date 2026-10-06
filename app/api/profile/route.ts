import { prisma } from "@/lib/db";
import { requireUser, success, error } from "@/lib/auth-session";
import { updateProfileSchema } from "@/lib/validation/workspace";

export async function GET() {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: result.user.id },
  });
  return success({ profile });
}

export async function PUT(request: Request) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("VALIDATION", "Invalid JSON body.", 400);
  }
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid profile data.", 400, parsed.error.flatten());
  }
  const profile = await prisma.studentProfile.upsert({
    where: { userId: result.user.id },
    create: { userId: result.user.id, ...parsed.data },
    update: parsed.data,
  });
  return success({ profile });
}
