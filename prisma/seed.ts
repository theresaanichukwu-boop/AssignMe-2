// AssignMe seed — work-type templates (§5), discipline packs (§6), plans (§23).
// Run: npx tsx prisma/seed.ts (requires DATABASE_URL)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { templates, disciplines, plans } from "./seed-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const t of templates) {
    await prisma.workTypeTemplate.upsert({
      where: { key: t.key },
      create: { key: t.key, name: t.name, structure: t.structure, guidance: t.guidance },
      update: { name: t.name, structure: t.structure, guidance: t.guidance },
    });
  }
  for (const d of disciplines) {
    const disc = await prisma.discipline.upsert({
      where: { name: d.name },
      create: { name: d.name },
      update: {},
    });
    await prisma.disciplinePack.upsert({
      where: { disciplineId: disc.id },
      create: { disciplineId: disc.id, ...d.pack },
      update: { ...d.pack, version: { increment: 1 } },
    });
  }
  for (const p of plans) {
    await prisma.plan.upsert({
      where: { key: p.key },
      create: p,
      update: { name: p.name, limits: p.limits, priceKobo: p.priceKobo },
    });
  }
  await prisma.featureConfiguration.upsert({
    where: { key: "usageLimits" },
    create: { key: "usageLimits", value: { free: plans[0].limits, premium: plans[1].limits } },
    update: { value: { free: plans[0].limits, premium: plans[1].limits } },
  });
  console.log("Seed complete: templates, disciplines, plans.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
