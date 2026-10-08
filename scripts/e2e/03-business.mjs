// Phase 5 smoke test — billing, trial hook, quotas, support, export, admin gates.
const BASE = "http://localhost:3100";
let cookie = "";

async function req(method, path, body, useCookie = true, rawBody) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
      ...(useCookie && cookie ? { Cookie: cookie } : {}),
    },
    body: rawBody ?? (body ? JSON.stringify(body) : undefined),
  });
  const sc = res.headers.get("set-cookie");
  if (sc) {
    const m = sc.match(/better-auth\.session_token=[^;]+/);
    if (m) cookie = m[0];
  }
  let json = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("json")) {
    try { json = await res.json(); } catch { /* ignore */ }
  }
  return { status: res.status, json, contentType: ct };
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

  const email = `p5${Date.now()}@example.com`;
  await req("POST", "/api/auth/sign-up/email", { email, password: "password123", name: "P5" }, false);

  const bill = await req("GET", "/api/billing");
  check("trial auto-created", bill.json?.data?.entitlement?.planKey === "TRIAL", `got ${bill.json?.data?.entitlement?.planKey}`);
  check("trial expiry present", !!bill.json?.data?.trial?.endsAt);
  check("account.create tracked", (bill.json?.data?.usage?.["account.create"] ?? 0) >= 1);

  const sub = await req("POST", "/api/billing", { planKey: "PREMIUM" });
  check(
    "paystack init (503 setup-gate w/o keys, 201 checkout with keys)",
    sub.status === 503 ||
      (sub.status === 201 && (sub.json?.data?.authorizationUrl ?? "").includes("paystack.com")),
    `got ${sub.status}`
  );

  const hook = await req("POST", "/api/billing/webhook", { event: "charge.success" });
  check("webhook rejects unsigned", hook.status === 403, `got ${hook.status}`);

  const ws = await req("POST", "/api/workspaces", { title: "P5 export", workType: "ESSAY", topic: "Export test" });
  const wsId = ws.json?.data?.workspace?.id;
  check("workspace created", !!wsId);
  await req("POST", `/api/workspaces/${wsId}/sections`, { key: "intro", title: "Introduction", content: "Export body text. ".repeat(30) });

  const exp = await req("POST", `/api/workspaces/${wsId}/export`);
  check("docx downloads", exp.status === 200 && exp.contentType.includes("officedocument"), `got ${exp.status} ${exp.contentType}`);
  const hist = await req("GET", `/api/workspaces/${wsId}/export`);
  check("export history", (hist.json?.data?.exportHistory ?? []).length === 1);

  const t = await req("POST", "/api/support", { category: "technical-problems", subject: "Smoke ticket", description: "Details here." });
  check("ticket created 201", t.status === 201, `got ${t.status}`);
  const tl = await req("GET", "/api/support");
  check("ticket listed", (tl.json?.data?.tickets ?? []).length === 1);

  const files = await req("POST", "/api/files", { key: "k", filename: "a.pdf", mimeType: "application/pdf", sizeBytes: 100 });
  check(
    "storage (503 setup-gate w/o keys, 201 upload URL with keys)",
    files.status === 503 || (files.status === 201 && !!(files.json?.data?.uploadUrl)),
    `got ${files.status}`
  );

  const adm = await req("GET", "/api/admin/users");
  check("admin gate 403", adm.status === 403, `got ${adm.status}`);
  const admT = await req("GET", "/api/admin/tickets");
  check("support-admin gate 403", admT.status === 403, `got ${admT.status}`);

  console.log(results.join("\n"));
}

main().catch((e) => { console.error("SMOKE ERROR", e); process.exit(1); });
