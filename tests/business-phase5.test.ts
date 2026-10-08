import { describe, expect, it, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import { objectKey, MAX_FILE_MB } from "../lib/storage/b2";
import { EVENT_FOR_LIMIT } from "../lib/billing/entitlement";
import { buildDocx } from "../lib/export/docx";

describe("webhook signature (PRD §24)", () => {
  const SECRET = "test-secret";

  beforeEach(() => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", SECRET);
  });

  it("accepts a correctly signed payload", async () => {
    const { verifyWebhookSignature } = await import("../lib/payments/paystack");
    const raw = JSON.stringify({ event: "charge.success", data: { reference: "r1" } });
    const sig = crypto.createHmac("sha512", SECRET).update(raw, "utf8").digest("hex");
    expect(verifyWebhookSignature(raw, sig)).toBe(true);
  });

  it("rejects tampered payloads and missing signatures", async () => {
    const { verifyWebhookSignature } = await import("../lib/payments/paystack");
    const raw = JSON.stringify({ event: "charge.success" });
    const sig = crypto.createHmac("sha512", SECRET).update(raw, "utf8").digest("hex");
    expect(verifyWebhookSignature(raw + "x", sig)).toBe(false);
    expect(verifyWebhookSignature(raw, null)).toBe(false);
    expect(verifyWebhookSignature(raw, "deadbeef")).toBe(false);
  });
});

describe("storage keys (PRD §26)", () => {
  it("scopes keys per user and strips traversal", () => {
    const key = objectKey("user_123", "../../etc/passwd");
    expect(key.startsWith("users/user_123/")).toBe(true);
    expect(key).not.toContain("..");
    expect(key.split("/").length).toBe(3);
  });

  it("sanitizes user ids", () => {
    expect(objectKey("a/b\\c", "f.pdf")).toMatch(/^users\/abc\//);
  });

  it("caps file size at 10MB", () => {
    expect(MAX_FILE_MB).toBe(10);
  });
});

describe("quota mapping (PRD §23)", () => {
  it("maps every limit to a metered event", () => {
    for (const k of ["aiGenerations", "researchSearches", "reviews", "workspaces", "exports", "storageMb"] as const) {
      expect(EVENT_FOR_LIMIT[k]).toBeTruthy();
    }
  });
});

describe("DOCX export (PRD §47)", () => {
  it("builds a non-empty document with references", async () => {
    const buf = await buildDocx({
      title: "Test",
      topic: "Topic",
      objectives: ["Do things"],
      sections: [{ title: "Introduction", content: "Hello world." }],
      sources: [{ title: "Paper", authors: ["A. Uthor"], year: 2024, publication: null, doi: null, url: null }],
      citationStyle: "APA_7",
    });
    expect(buf.length).toBeGreaterThan(1000);
  });
});
