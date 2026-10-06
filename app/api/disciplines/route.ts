import { prisma } from "@/lib/db";
import { success } from "@/lib/auth-session";

export async function GET() {
  const disciplines = await prisma.discipline.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return success({ disciplines });
}
