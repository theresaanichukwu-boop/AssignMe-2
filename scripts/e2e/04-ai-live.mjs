// Gemini live-generation check — verifies GEMINI_API_KEY end to end.
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
  const sc = res.headers.get("set-cookie");
  if (sc) {
    const m = sc.match(/better-auth\.session_token=[^;]+/);
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

  const email = `live${Date.now()}@example.com`;
  await req("POST", "/api/auth/sign-up/email", { email, password: "password123", name: "Live" }, false);
  const ws = await req("POST", "/api/workspaces", {
    title: "Live generation test", workType: "ESSAY",
    topic: "The benefits of active learning in undergraduate education",
    objectives: ["Explain active learning strategies"],
  });
  const wsId = ws.json?.data?.workspace?.id;
  check("workspace created", !!wsId);

  await req("POST", `/api/workspaces/${wsId}/evidence`, {
    keyFinding: "Meta-analyses report higher performance in active learning classrooms (verified).",
    citationText: "(Theobald et al., 2024)",
    relevance: "High",
  });

  const gen = await req("POST", `/api/workspaces/${wsId}/generate`, {
    task: "Draft a 150-word introduction defining active learning and its relevance.",
    sectionTitle: "Introduction",
    sectionKey: "introduction",
    mode: "BUILD_WITH_ME",
  });
  const result = gen.json?.data?.result;
  check("http 200", gen.status === 200, `got ${gen.status}: ${(result?.warnings ?? []).join("; ").slice(0, 200)}`);
  check("status DRAFT/NEEDS_REVIEW", result?.status === "DRAFT" || result?.status === "NEEDS_REVIEW", `got ${result?.status}`);
  check("non-empty answer", (result?.answer ?? "").length > 100, `${(result?.answer ?? "").length} chars`);
  check("response persisted", !!result?.responseId);

  // saveToSection path
  const save = await req("POST", `/api/workspaces/${wsId}/generate`, {
    task: "Draft a 150-word introduction defining active learning.",
    sectionTitle: "Introduction",
    sectionKey: "introduction",
    mode: "BUILD_WITH_ME",
    saveToSection: true,
  });
  check("save path 200", save.status === 200, `got ${save.status}`);
  const got = await req("GET", `/api/workspaces/${wsId}/sections`);
  const intro = (got.json?.data?.sections ?? []).find((s) => s.key === "introduction");
  check("section saved with AI content", !!intro && intro.content.length > 100, `${intro?.content?.length ?? 0} chars`);

  console.log(results.join("\n"));
  if (result?.answer) console.log("---SAMPLE---\n" + result.answer.slice(0, 400));
}

main().catch((e) => { console.error("SMOKE ERROR", e); process.exit(1); });
