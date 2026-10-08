// Academic workflow live check: helper, Main Build, brief, draft, editor, review.
const BASE = "http://localhost:3100";
let cookie = "";

async function req(method, path, body, useCookie = true) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", Origin: BASE, ...(useCookie && cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const sc = res.headers.get("set-cookie");
  if (sc) {
    const m = sc.match(/better-auth\.session_token=[^;]+/);
    if (m) cookie = m[0];
  }
  let json = null;
  if ((res.headers.get("content-type") ?? "").includes("json")) {
    try { json = await res.json(); } catch { /* ignore */ }
  }
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

  await req("POST", "/api/auth/sign-up/email", { email: `wf${Date.now()}@example.com`, password: "password123", name: "Wf" }, false);
  const ws = await req("POST", "/api/workspaces", { title: "WF essay", workType: "ESSAY", topic: "Social media and attention" });
  const wsId = ws.json?.data?.workspace?.id;
  check("workspace created", !!wsId);

  // Helper is advisory only: workspace topic must NOT change.
  const help = await req("POST", `/api/workspaces/${wsId}/helper`, { mode: "topic-ideas", input: "social media focus students" });
  check("helper suggests", help.status === 200 && (help.json?.data?.result?.answer ?? "").length > 50, `got ${help.status}`);
  const afterHelp = await req("GET", `/api/workspaces/${wsId}`);
  check("helper writes nothing", afterHelp.json?.data?.workspace?.topic === "Social media and attention");

  // Main Build: approved topic + instructions, no objectives for essay.
  const patch = await req("PATCH", `/api/workspaces/${wsId}`, {
    topic: "The effect of short-form video on student attention spans",
    instructions: "Use APA 7. No objectives needed.",
    sourceYearFrom: 2022, sourceYearTo: 2026,
  });
  check("main build saved", patch.json?.data?.workspace?.topic?.includes("short-form") === true);

  // Brief + draft + add to editor (first to empty section, then overwrite path).
  const brief = await req("POST", `/api/workspaces/${wsId}/helper`, { mode: "brief", input: "x", sectionTitle: "Introduction" });
  check("brief generated", brief.status === 200 && (brief.json?.data?.result?.answer ?? "").length > 30, `got ${brief.status}`);
  await req("POST", `/api/workspaces/${wsId}/sections`, { key: "introduction", title: "Introduction", content: "", order: 0 });
  const draft = await req("POST", `/api/workspaces/${wsId}/generate`, {
    task: "Draft the introduction in 120 words.", sectionTitle: "Introduction", sectionKey: "introduction", mode: "BUILD_WITH_ME",
  });
  check("draft generated", ["DRAFT", "NEEDS_REVIEW"].includes(draft.json?.data?.result?.status), `got ${draft.json?.data?.result?.status}`);
  const content = draft.json?.data?.result?.answer ?? "";
  const save = await req("POST", `/api/workspaces/${wsId}/sections`, { key: "introduction", title: "Introduction", content, order: 0 });
  check("added to editor", save.status === 200 && (save.json?.data?.section?.content ?? "").length > 50);

  // Structure check flags essay-appropriate bar (no methodology demand).
  const rev = await req("POST", `/api/workspaces/${wsId}/review`, { sectionId: save.json?.data?.section?.id });
  const structIssues = (rev.json?.data?.review?.issues ?? []).filter((i) => i.dimension === "Structure");
  check("review runs with structure check", rev.status === 201, `got ${rev.status}: ${structIssues.map((i) => i.message).join("; ").slice(0, 160)}`);

  // Section delete.
  const extra = await req("POST", `/api/workspaces/${wsId}/sections`, { key: "tmp", title: "Tmp", content: "", order: 5 });
  const del = await fetch(`${BASE}/api/workspaces/${wsId}/sections?sectionId=${extra.json?.data?.section?.id}`, {
    method: "DELETE", headers: { Origin: BASE, Cookie: cookie },
  });
  check("section deleted", del.status === 200, `got ${del.status}`);

  // Research honors the Main Build year window.
  const res = await req("POST", `/api/workspaces/${wsId}/research`, { query: "attention span students", limit: 5 });
  const w = res.json?.data?.window;
  check("research uses workspace window", res.status === 201 && w?.from === 2022 && w?.to === 2026, `got ${res.status} ${JSON.stringify(w)}`);

  console.log(results.join("\n"));
}

main().catch((e) => { console.error("SMOKE ERROR", e); process.exit(1); });
