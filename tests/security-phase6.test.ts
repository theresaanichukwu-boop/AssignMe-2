import { describe, expect, it } from "vitest";
import { z } from "zod";
import { checkRateLimit, rateLimitedResponse, RATE_LIMITS, type Counter } from "../lib/security/rate-limit";

function fakeCounter(): Counter & { counts: Map<string, number> } {
  const counts = new Map<string, number>();
  return {
    counts,
    async incr(key: string) {
      const n = (counts.get(key) ?? 0) + 1;
      counts.set(key, n);
      return n;
    },
    async expire() {
      return 1;
    },
  };
}

const supportSchema = z.object({
  category: z.string().min(1).max(100),
  subject: z.string().min(1).max(300),
  description: z.string().min(1).max(10000),
});

const fileSchema = z.object({
  key: z.string().min(1).max(300),
  filename: z.string().min(1).max(200),
  mimeType: z.string().min(1).max(200),
  sizeBytes: z.number().int().min(1).max(10 * 1024 * 1024),
});

describe("rate limiting (PRD §30)", () => {
  it("allows under the limit and blocks over it", async () => {
    const store = fakeCounter();
    const max = RATE_LIMITS["ai.generate"].max;
    for (let i = 0; i < max; i++) {
      expect((await checkRateLimit("ai.generate", "u1", store)).allowed).toBe(true);
    }
    const over = await checkRateLimit("ai.generate", "u1", store);
    expect(over.allowed).toBe(false);
    expect(over.remaining).toBe(0);
  });

  it("scopes buckets per user", async () => {
    const store = fakeCounter();
    const max = RATE_LIMITS["ai.generate"].max;
    for (let i = 0; i < max; i++) await checkRateLimit("ai.generate", "u1", store);
    expect((await checkRateLimit("ai.generate", "u2", store)).allowed).toBe(true);
  });

  it("fails open without Redis", async () => {
    expect((await checkRateLimit("ai.generate", "u9", null)).allowed).toBe(true);
  });

  it("returns 429 envelope", async () => {
    const res = rateLimitedResponse();
    expect(res.status).toBe(429);
    const json = (await res.json()) as { error: { code: string } };
    expect(json.error.code).toBe("RATE_LIMITED");
  });

  it("defines limits for every metered action", () => {
    for (const a of ["ai.generate", "research.search", "review.run", "export.run", "billing.init"]) {
      expect(RATE_LIMITS[a].max).toBeGreaterThan(0);
    }
  });
});

describe("input validation (PRD §30)", () => {
  it("rejects empty support tickets and oversized fields", () => {
    expect(supportSchema.safeParse({ category: "", subject: "s", description: "d" }).success).toBe(false);
    expect(supportSchema.safeParse({ category: "x", subject: "s", description: "" }).success).toBe(false);
    expect(
      supportSchema.safeParse({ category: "x", subject: "s", description: "d".repeat(10001) }).success
    ).toBe(false);
  });

  it("rejects oversized or empty file metadata", () => {
    expect(
      fileSchema.safeParse({ key: "k", filename: "a.pdf", mimeType: "application/pdf", sizeBytes: 11 * 1024 * 1024 }).success
    ).toBe(false);
    expect(
      fileSchema.safeParse({ key: "k", filename: "a.pdf", mimeType: "application/pdf", sizeBytes: 0 }).success
    ).toBe(false);
  });
});
