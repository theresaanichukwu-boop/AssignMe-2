// Paystack test-mode verification — initialize only (no charge), then verify.
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

  await req("POST", "/api/auth/sign-up/email", { email: `pay${Date.now()}@example.com`, password: "password123", name: "Pay" }, false);

  const init = await req("POST", "/api/billing", { planKey: "PREMIUM" });
  const authUrl = init.json?.data?.authorizationUrl ?? "";
  const ref = init.json?.data?.reference ?? "";
  check("init returns paystack checkout", init.status === 201 && authUrl.includes("paystack.com"), `got ${init.status}`);
  check("reference issued", !!ref, ref);

  // Never paid: server-side verify must report failure, never success.
  const verify = await fetch(`${BASE}/api/billing?reference=${encodeURIComponent(ref)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Origin: BASE, Cookie: cookie },
  });
  const vj = await verify.json().catch(() => null);
  check("unpaid verify fails closed", verify.status === 402, `got ${verify.status}: ${JSON.stringify(vj?.error ?? vj?.data ?? "")}`.slice(0, 160));

  console.log(results.join("\n"));
}

main().catch((e) => { console.error("SMOKE ERROR", e); process.exit(1); });
