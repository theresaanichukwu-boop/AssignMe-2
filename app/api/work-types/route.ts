import { prisma } from "@/lib/db";
import { success } from "@/lib/auth-session";

export async function GET() {
  const workTypes = await prisma.workTypeTemplate.findMany({
    orderBy: { name: "asc" },
  });
  return success({ workTypes });
}
