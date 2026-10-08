// Phase 3 smoke test — runs against http://localhost:3100
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
    // keep better-auth session cookie
    const match = setCookie.match(/better-auth\.session_token=[^;]+/);
    if (match) cookie = match[0];
  }
  let json = null;
  try {
    json = await res.json();
  } catch { /* non-JSON */ }
  return { status: res.status, json };
}

async function main() {
  const results = [];
  const check = (name, cond, extra = "") => {
    results.push(`${cond ? "PASS" : "FAIL"} ${name} ${extra}`);
    if (!cond) process.exitCode = 1;
  };

  // wait for server
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      const r = await req("GET", "/api/health", null, false);
      if (r.status === 200) { ready = true; break; }
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 3000));
  }
  check("server ready", ready);

  const email = `smoke${Date.now()}@example.com`;
  const signup = await req("POST", "/api/auth/sign-up/email", { email, password: "password123", name: "Smoke" }, false);
  check("signup 200", signup.status === 200, `got ${signup.status}`);
  check("session cookie set", cookie.includes("better-auth.session_token"));

  const wt = await req("GET", "/api/work-types");
  check("6 work-type templates", wt.json?.data?.workTypes?.length === 6, `got ${wt.json?.data?.workTypes?.length}`);

  const disc = await req("GET", "/api/disciplines");
  check("4 disciplines", disc.json?.data?.disciplines?.length === 4, `got ${disc.json?.data?.disciplines?.length}`);

  const ws = await req("POST", "/api/workspaces", { title: "Smoke essay", workType: "ESSAY", topic: "Test topic" });
  check("create workspace 201", ws.status === 201, `got ${ws.status}`);
  const wsId = ws.json?.data?.workspace?.id;
  check("workspace id", !!wsId);

  const list = await req("GET", "/api/workspaces");
  check("list contains workspace", list.json?.data?.workspaces?.some((w) => w.id === wsId));

  const unauth = await req("GET", "/api/workspaces", null, false);
  check("unauth 401", unauth.status === 401, `got ${unauth.status}`);

  const sec = await req("POST", `/api/workspaces/${wsId}/sections`, { key: "intro", title: "Introduction", content: "Hello world" });
  check("upsert section 201", sec.status === 201, `got ${sec.status}`);
  const sectionId = sec.json?.data?.section?.id;

  const snap = await req("POST", `/api/workspaces/${wsId}/versions`, { sectionId });
  check("snapshot version 201", snap.status === 201, `got ${snap.status}`);

  const upd = await req("POST", `/api/workspaces/${wsId}/sections`, { key: "intro", title: "Introduction", content: "Edited content" });
  check("edit section 200", upd.status === 200, `got ${upd.status}`);

  const restore = await req("POST", `/api/workspaces/${wsId}/versions`, { sectionId, version: 1 });
  check("restore version", restore.json?.ok === true && restore.json?.data?.version === 2, JSON.stringify(restore.json?.data));

  const prof = await req("PUT", "/api/profile", { institution: "UNILAG", citationStyle: "APA_7" });
  check("update profile", prof.json?.ok === true);

  // cross-user isolation
  cookie = "";
  const email2 = `smoke2${Date.now()}@example.com`;
  await req("POST", "/api/auth/sign-up/email", { email: email2, password: "password123", name: "Smoke2" }, false);
  const cross = await req("GET", `/api/workspaces/${wsId}`);
  check("cross-user 404", cross.status === 404, `got ${cross.status}`);

  console.log(results.join("\n"));
}

main().catch((e) => {
  console.error("SMOKE ERROR", e);
  process.exit(1);
});
