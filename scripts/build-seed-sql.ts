// Builds scripts/supabase-setup.sql: both migrations + idempotent seed INSERTs,
// for networks where direct Postgres (port 5432) is unreachable. Run the output
// in Supabase Dashboard → SQL Editor. Usage: node scripts/build-seed-sql.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { templates, disciplines, plans } from "../prisma/seed-data.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const sql = (v: unknown): string => `'${JSON.stringify(v).replace(/'/g, "''")}'`;
const str = (v: string): string => `'${v.replace(/'/g, "''")}'`;

const parts: string[] = [];
parts.push("-- AssignMe Supabase setup: schema (2 migrations) + seed. Idempotent: safe to re-run.");
parts.push(fs.readFileSync(path.join(root, "prisma/migrations/20261006211738_init/migration.sql"), "utf8"));
parts.push(fs.readFileSync(path.join(root, "prisma/migrations/20261008100525_workspace_build_fields/migration.sql"), "utf8"));

parts.push("-- Seed data (mirrors prisma/seed.ts; ON CONFLICT = upsert).");
for (const t of templates) {
  parts.push(
    `INSERT INTO "WorkTypeTemplate" ("id", "key", "name", "structure", "guidance", "version", "updatedAt") VALUES (gen_random_uuid(), '${t.key}', ${str(t.name)}, ${sql(t.structure)}::jsonb, ${sql(t.guidance)}::jsonb, 1, now()) ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name", "structure" = EXCLUDED."structure", "guidance" = EXCLUDED."guidance";`
  );
}
for (const d of disciplines) {
  const p = d.pack as Record<string, unknown>;
  parts.push(
    `INSERT INTO "Discipline" ("id", "name") VALUES (gen_random_uuid(), ${str(d.name)}) ON CONFLICT ("name") DO NOTHING;`
  );
  parts.push(
    `INSERT INTO "DisciplinePack" ("id", "disciplineId", "terminology", "conventions", "structures", "methodologies", "frameworks", "evidencePrefs", "commonErrors", "reviewRules", "writingNotes", "version", "updatedAt") SELECT gen_random_uuid(), "id", ${sql(p.terminology)}::jsonb, ${sql(p.conventions)}::jsonb, ${sql(p.structures)}::jsonb, ${sql(p.methodologies)}::jsonb, ${sql(p.frameworks)}::jsonb, ${sql(p.evidencePrefs)}::jsonb, ${sql(p.commonErrors)}::jsonb, ${sql(p.reviewRules)}::jsonb, ${sql(p.writingNotes)}::jsonb, 1, now() FROM "Discipline" WHERE "name" = ${str(d.name)} ON CONFLICT ("disciplineId") DO UPDATE SET "terminology" = EXCLUDED."terminology", "conventions" = EXCLUDED."conventions", "structures" = EXCLUDED."structures", "methodologies" = EXCLUDED."methodologies", "frameworks" = EXCLUDED."frameworks", "evidencePrefs" = EXCLUDED."evidencePrefs", "commonErrors" = EXCLUDED."commonErrors", "reviewRules" = EXCLUDED."reviewRules", "writingNotes" = EXCLUDED."writingNotes";`
  );
}
for (const p of plans) {
  parts.push(
    `INSERT INTO "Plan" ("id", "key", "name", "limits", "priceKobo") VALUES (gen_random_uuid(), '${p.key}', ${str(p.name)}, ${sql(p.limits)}::jsonb, ${p.priceKobo}) ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name", "limits" = EXCLUDED."limits", "priceKobo" = EXCLUDED."priceKobo";`
  );
}
parts.push(
  `INSERT INTO "FeatureConfiguration" ("id", "key", "value", "updatedAt") VALUES (gen_random_uuid(), 'usageLimits', ${sql({ free: plans[0].limits, premium: plans[1].limits })}::jsonb, now()) ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value";`
);

fs.writeFileSync(path.join(root, "scripts/supabase-setup.sql"), parts.join("\n") + "\n");
console.log("wrote scripts/supabase-setup.sql");
