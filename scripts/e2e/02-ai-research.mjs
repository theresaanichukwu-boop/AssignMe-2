// Phase 4 smoke test — research, evidence, review, generate, citations.
const BASE = "http://localhost:3100";
let cookie = "";

async function req(method, path, body, useCookie = true) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
      ...(useCookie && cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const m = setCookie.match(/better-auth\.session_token=[^;]+/);
    if (m) cookie = m[0];
  }
  let json = null;
  try { json = await res.json(); } catch { /* ignore */ }
  return { status: res.status, json };
}

async function main() {
  const results = [];
  const check = (name, cond, extra = "") => {
    results.push(`${cond ? "PASS" : "FAIL"} ${name} ${extra}`);
    if (!cond) process.exitCode = 1;
  };

  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      const r = await req("GET", "/api/health", null, false);
      if (r.status === 200) { ready = true; break; }
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 3000));
  }
  check("server ready", ready);

  const email = `p4${Date.now()}@example.com`;
  await req("POST", "/api/auth/sign-up/email", { email, password: "password123", name: "P4" }, false);
  const ws = await req("POST", "/api/workspaces", { title: "P4 research", workType: "ESSAY", topic: "Active learning in Nigerian universities" });
  const wsId = ws.json?.data?.workspace?.id;
  check("workspace created", !!wsId);

  // Citations (deterministic, no key needed)
  const cit = await req("POST", "/api/citations", {
    style: "APA_7", title: "Learning gains", authors: ["Adaeze Okafor"], year: 2024,
    publication: "J. of Study", doi: "10.0000/x",
  });
  check("citation formatted", cit.json?.data?.formatted?.includes("Okafor"), JSON.stringify(cit.json?.data?.formatted));
  check("citation clean", (cit.json?.data?.problems ?? []).length === 0);

  // Generate without key -> BLOCKED (graceful, persisted)
  const gen = await req("POST", `/api/workspaces/${wsId}/generate`, { task: "Draft the introduction.", mode: "BUILD_WITH_ME" });
  const gStatus = gen.json?.data?.result?.status;
  check(
    "generate guarded (BLOCKED w/o key, DRAFT/NEEDS_REVIEW/ERROR with key+quota)",
    ["BLOCKED", "DRAFT", "NEEDS_REVIEW", "ERROR"].includes(gStatus) && Array.isArray(gen.json?.data?.result?.warnings),
    `got ${gStatus}`
  );

  // Sections + review (deterministic)
  const sec = await req("POST", `/api/workspaces/${wsId}/sections`, { key: "intro", title: "Introduction", content: "This proves everything conclusively and always works. " + "Balanced discussion of active learning approaches in scope. ".repeat(10) });
  const sectionId = sec.json?.data?.section?.id;
  const rev = await req("POST", `/api/workspaces/${wsId}/review`, { sectionId });
  const severities = (rev.json?.data?.review?.issues ?? []).map((i) => i.severity);
  check("review 201", rev.status === 201, `got ${rev.status}`);
  check("review flags CRITICAL", severities.includes("CRITICAL"), severities.join(","));

  // Research against live providers (or graceful 502)
  const res = await req("POST", `/api/workspaces/${wsId}/research`, { query: "active learning higher education", limit: 5 });
  if (res.status === 201) {
    const inWindow = (res.json?.data?.results ?? []).every((r) => r.year === null || (r.year >= 2021 && r.year <= 2026));
    check("research results in-window", inWindow, `${res.json?.data?.results?.length} results, ${res.json?.data?.saved} saved`);
    const srcs = await req("GET", `/api/workspaces/${wsId}/sources`);
    check("sources listed", (srcs.json?.data?.sources ?? []).length > 0);
  } else {
    check("research graceful degradation", res.status === 502, `got ${res.status}`);
  }

  // Evidence pool
  const ev = await req("POST", `/api/workspaces/${wsId}/evidence`, { keyFinding: "Active learning improves retention (verified).", relevance: "High" });
  check("evidence saved 201", ev.status === 201, `got ${ev.status}`);
  const evList = await req("GET", `/api/workspaces/${wsId}/evidence`);
  check("evidence listed", (evList.json?.data?.evidence ?? []).length >= 1);

  console.log(results.join("\n"));
}

main().catch((e) => { console.error("SMOKE ERROR", e); process.exit(1); });
