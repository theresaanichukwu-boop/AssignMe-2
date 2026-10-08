// Paystack integration, test mode first (PRD §24).
// Server verifies everything; client data is never trusted.

import crypto from "node:crypto";

const BASE = "https://api.paystack.co";

function secret(): string | null {
  return process.env.PAYSTACK_SECRET_KEY || null;
}

export function paystackConfigured(): boolean {
  return !!secret();
}

export interface InitResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export function newReference(): string {
  return `assignme_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
}

export async function initializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<InitResult> {
  const key = secret();
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata ?? {},
    }),
  });
  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url: string; access_code: string; reference: string };
  };
  if (!res.ok || !json.status || !json.data) {
    throw new Error(`Paystack initialize failed: ${json.message ?? res.status}`);
  }
  return {
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
    reference: json.data.reference,
  };
}

export interface VerifiedTransaction {
  status: string;
  amount: number;
  reference: string;
  paidAt: string | null;
  raw: unknown;
}

export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  const key = secret();
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: { status: string; amount: number; reference: string; paid_at: string | null };
  };
  if (!res.ok || !json.status || !json.data) {
    throw new Error(`Paystack verify failed: ${json.message ?? res.status}`);
  }
  return {
    status: json.data.status,
    amount: json.data.amount,
    reference: json.data.reference,
    paidAt: json.data.paid_at,
    raw: json.data,
  };
}

/** Validate the webhook HMAC-SHA512 signature over the RAW body (PRD §24). */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const key = secret();
  if (!key || !signature) return false;
  const expected = crypto.createHmac("sha512", key).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
