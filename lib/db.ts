import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7: runtime connection goes through a driver adapter.
// CLI migrations use prisma.config.ts -> DATABASE_URL.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Production Netlify Database (Neon) is exposed as NETLIFY_DB_URL.
// Prefer an explicit DATABASE_URL when set; otherwise use the provisioned one.
function databaseUrl(): string {
  return process.env.DATABASE_URL ?? process.env.NETLIFY_DB_URL ?? "";
}

function createClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: databaseUrl(),
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
