// Redis-backed fixed-window rate limiting (PRD §30).
// Fails open with a warning when Redis is unreachable (availability over
// strictness for a student workspace); every decision is logged.

export interface Counter {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
}

let shared: Counter | null = null;
let warned = false;

async function getClient(): Promise<Counter | null> {
  if (shared) return shared;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    const { createClient } = await import("redis");
    const client = createClient({ url });
    client.on("error", () => undefined);
    await client.connect();
    shared = client as unknown as Counter;
    return shared;
  } catch {
    return null;
  }
}

export const RATE_LIMITS: Record<string, { max: number; windowSec: number }> = {
  "ai.generate": { max: 10, windowSec: 60 },
  "research.search": { max: 10, windowSec: 60 },
  "review.run": { max: 10, windowSec: 60 },
  "export.run": { max: 5, windowSec: 300 },
  "billing.init": { max: 5, windowSec: 300 },
  "auth": { max: 20, windowSec: 300 },
};

export async function checkRateLimit(
  action: string,
  id: string,
  client?: Counter | null
): Promise<{ allowed: boolean; remaining: number }> {
  const rule = RATE_LIMITS[action] ?? { max: 30, windowSec: 60 };
  const store = client ?? (await getClient());
  if (!store) {
    if (!warned) {
      warned = true;
      console.warn("[rate-limit] Redis unavailable — allowing (fail-open).");
    }
    return { allowed: true, remaining: rule.max };
  }
  try {
    const key = `rl:${action}:${id}`;
    const count = await store.incr(key);
    if (count === 1) await store.expire(key, rule.windowSec);
    return { allowed: count <= rule.max, remaining: Math.max(0, rule.max - count) };
  } catch {
    return { allowed: true, remaining: rule.max };
  }
}

export function rateLimitedResponse() {
  return Response.json(
    { ok: false, error: { code: "RATE_LIMITED", message: "Too many requests. Slow down and retry." } },
    { status: 429 }
  );
}
