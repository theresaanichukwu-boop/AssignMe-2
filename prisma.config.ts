import "dotenv/config";
import { defineConfig } from "prisma/config";

// Production Netlify Database (Neon) is exposed as NETLIFY_DB_URL.
// Prefer an explicit DATABASE_URL when set; otherwise use the provisioned one.
const databaseUrl = process.env.DATABASE_URL ?? process.env.NETLIFY_DB_URL ?? "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
