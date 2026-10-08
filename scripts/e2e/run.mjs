// E2E runner: executes journey suites against a running app.
// Prerequisites: `docker compose up -d db redis`, migrated + seeded DB,
// `next dev -p 3100` (or any server on $BASE). Suites 04-06 touch live
// providers/quotas: 04 consumes Gemini quota, 05 writes a probe file to B2,
// 06 creates a pending Paystack transaction. Default run covers 01-03.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const only = process.argv[2]; // e.g. "01" or "all-live"
const suites = {
  "01": "01-core.mjs",
  "02": "02-ai-research.mjs",
  "03": "03-business.mjs",
  "04": "04-ai-live.mjs",
  "05": "05-storage.mjs",
  "06": "06-billing.mjs",
};

const selected =
  only === "all-live" ? Object.values(suites) : only && suites[only] ? [suites[only]] : Object.values(suites).slice(0, 3);

let failed = false;
for (const s of selected) {
  console.log(`\n=== ${s} ===`);
  const r = spawnSync("node", [path.join(dir, s)], { stdio: "inherit" });
  if (r.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
