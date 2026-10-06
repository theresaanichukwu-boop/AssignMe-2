// AssignMe seed — work-type templates (§5), discipline packs (§6), plans (§23).
// Run: npx tsx prisma/seed.ts (requires DATABASE_URL)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

const templates = [
  {
    key: "ASSIGNMENT" as const,
    name: "Assignment",
    structure: {
      stages: ["parse-question", "scope", "structure", "draft", "review"],
      commandWords: ["Define", "Explain", "Discuss", "Compare", "Analyse", "Evaluate", "Critically evaluate", "Examine", "Justify"],
      sections: ["Introduction", "Main answer", "Conclusion", "References"],
    },
    guidance: { note: "Identify command words, scope, concepts, evidence requirements, and expected answer structure." },
  },
  {
    key: "ESSAY" as const,
    name: "Essay",
    structure: { sections: ["Introduction", "Thesis/central argument", "Main discussion", "Evidence and analysis", "Counterargument", "Conclusion", "References"] },
    guidance: {},
  },
  {
    key: "SEMINAR" as const,
    name: "Seminar",
    structure: { sections: ["Introduction", "Objectives", "Background", "Main discussion", "Evidence", "Conclusion", "Recommendations", "References"] },
    guidance: { note: "Adapt to discipline and institutional requirements." },
  },
  {
    key: "RESEARCH_PROJECT" as const,
    name: "Research Project",
    structure: { sections: ["Chapter One: Introduction", "Chapter Two: Literature Review", "Chapter Three: Methodology", "Chapter Four: Results", "Chapter Five: Discussion, Conclusion and Recommendations"] },
    guidance: { note: "Chapter structure is configurable per institution and discipline." },
  },
  {
    key: "LITERATURE_REVIEW" as const,
    name: "Literature Review",
    structure: { sections: ["Review question", "Search strategy", "Source selection", "Thematic organization", "Critical synthesis", "Evidence comparison", "Research gaps", "Conclusion", "References"] },
    guidance: { note: "Synthesize evidence; do not merely summarize sources individually." },
  },
  {
    key: "CASE_STUDY" as const,
    name: "Case Study",
    structure: { sections: ["Case background", "Problem/context", "Evidence", "Analysis", "Relevant framework", "Options", "Evaluation", "Recommendation", "Conclusion", "References"] },
    guidance: { note: "Adapt structure to the discipline." },
  },
];

const disciplines = [
  { name: "General", pack: { terminology: {}, conventions: {}, structures: {}, methodologies: [], frameworks: [], evidencePrefs: {}, commonErrors: [], reviewRules: [], writingNotes: {} } },
  { name: "Nursing", pack: { terminology: {}, conventions: { style: "APA 7" }, structures: {}, methodologies: ["Quantitative", "Qualitative", "Mixed methods"], frameworks: [], evidencePrefs: { recencyYears: 5 }, commonErrors: [], reviewRules: [], writingNotes: {} } },
  { name: "Computer Science", pack: { terminology: {}, conventions: { style: "IEEE" }, structures: {}, methodologies: ["Experimental", "Design science"], frameworks: [], evidencePrefs: { recencyYears: 5 }, commonErrors: [], reviewRules: [], writingNotes: {} } },
  { name: "Business Administration", pack: { terminology: {}, conventions: { style: "Harvard" }, structures: {}, methodologies: ["Case study", "Survey"], frameworks: ["SWOT", "PESTLE"], evidencePrefs: { recencyYears: 5 }, commonErrors: [], reviewRules: [], writingNotes: {} } },
];

const plans = [
  { key: "FREE", name: "Free", limits: { aiGenerations: 20, researchSearches: 10, reviews: 5, workspaces: 3, exports: 5, storageMb: 100 }, priceKobo: 0 },
  { key: "PREMIUM", name: "Premium", limits: { aiGenerations: 500, researchSearches: 300, reviews: 200, workspaces: 50, exports: 200, storageMb: 5120 }, priceKobo: 250000 },
  { key: "TRIAL", name: "One-month Premium Trial", limits: { aiGenerations: 100, researchSearches: 60, reviews: 40, workspaces: 10, exports: 40, storageMb: 1024 }, priceKobo: 0 },
];

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
