// B2 live round-trip: upload URL -> PUT -> ledger -> download URL -> GET content.
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

  await req("POST", "/api/auth/sign-up/email", { email: `b2-${Date.now()}@example.com`, password: "password123", name: "B2" }, false);

  const content = "Backblaze B2 round-trip probe.";
  const up = await req("POST", "/api/files", {
    key: "probe", filename: "b2-probe.txt", mimeType: "text/plain", sizeBytes: Buffer.byteLength(content),
  });
  check("upload URL issued 201", up.status === 201, `got ${up.status}: ${JSON.stringify(up.json?.error ?? up.json?.data?.file?.filename ?? "")}`);
  const uploadUrl = up.json?.data?.uploadUrl;
  const fileKey = up.json?.data?.file?.r2Key;

  if (uploadUrl) {
    const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "text/plain", "Content-Length": String(Buffer.byteLength(content)) }, body: content });
    check("PUT to B2", put.status === 200, `got ${put.status}`);
  } else {
    check("PUT to B2", false, "no upload URL");
  }

  const dl = await req("GET", `/api/files?key=${encodeURIComponent(fileKey ?? "")}`);
  check("download URL issued", dl.status === 200 && !!dl.json?.data?.downloadUrl, `got ${dl.status}`);
  if (dl.json?.data?.downloadUrl) {
    const get = await fetch(dl.json.data.downloadUrl);
    const text = await get.text();
    check("round-trip content matches", get.status === 200 && text === content, `got ${get.status}`);
  }

  const list = await req("GET", "/api/files");
  check("ledger lists file", (list.json?.data?.files ?? []).some((f) => f.r2Key === fileKey));

  console.log(results.join("\n"));
  console.log("KEY:" + fileKey);
}

main().catch((e) => { console.error("SMOKE ERROR", e); process.exit(1); });
