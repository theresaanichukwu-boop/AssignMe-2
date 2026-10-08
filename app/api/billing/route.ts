import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, success, error } from "@/lib/auth-session";
import { getEntitlement, usageInWindow } from "@/lib/billing/entitlement";
import {
  paystackConfigured,
  initializeTransaction,
  newReference,
  verifyTransaction,
} from "@/lib/payments/paystack";
import { sendEmail, templates } from "@/lib/email/resend";

export async function GET() {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const [entitlement, usage, plans, trial] = await Promise.all([
    getEntitlement(result.user.id),
    usageInWindow(result.user.id),
    prisma.plan.findMany(),
    prisma.trial.findFirst({ where: { userId: result.user.id }, orderBy: { endsAt: "desc" } }),
  ]);
  return success({
    entitlement,
    usage,
    plans: plans.map((p) => ({ key: p.key, name: p.name, limits: p.limits, priceKobo: p.priceKobo })),
    trial,
    paystackConfigured: paystackConfigured(),
  });
}

const subscribeSchema = z.object({ planKey: z.literal("PREMIUM") });

export async function POST(request: Request) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  if (!paystackConfigured()) {
    return error("SETUP", "Payments are not configured yet.", 503);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("VALIDATION", "Invalid JSON body.", 400);
  }
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return error("VALIDATION", "Invalid subscription request.", 400, parsed.error.flatten());
  }
  const plan = await prisma.plan.findUnique({ where: { key: "PREMIUM" } });
  if (!plan) return error("SETUP", "Premium plan is not configured.", 503);

  const reference = newReference();
  await prisma.paymentTransaction.create({
    data: {
      userId: result.user.id,
      paystackReference: reference,
      amountKobo: plan.priceKobo,
      status: "PENDING",
    },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  try {
    const init = await initializeTransaction({
      email: result.user.email,
      amountKobo: plan.priceKobo,
      reference,
      callbackUrl: `${appUrl}/billing/verify?reference=${reference}`,
      metadata: { userId: result.user.id, planKey: "PREMIUM" },
    });
    return success({ authorizationUrl: init.authorizationUrl, reference }, 201);
  } catch (e) {
    await prisma.paymentTransaction.updateMany({
      where: { paystackReference: reference },
      data: { status: "FAILED", raw: { error: (e as Error).message } },
    });
    return error("UPSTREAM_ERROR", "Could not start the payment. Try again later.", 502);
  }
}

/** Payment callback verification — server re-verifies with Paystack (never trusts client). */
export async function PUT(request: Request) {
  const result = await requireUser();
  if ("response" in result) return result.response;
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  if (!reference) return error("VALIDATION", "reference is required.", 400);

  const tx = await prisma.paymentTransaction.findFirst({
    where: { paystackReference: reference, userId: result.user.id },
  });
  if (!tx) return error("NOT_FOUND", "Transaction not found.", 404);
  if (tx.status === "SUCCESS") return success({ verified: true });

  let verified;
  try {
    verified = await verifyTransaction(reference);
  } catch {
    return error("UPSTREAM_ERROR", "Could not verify with Paystack.", 502);
  }
  if (verified.status !== "success" || verified.amount !== tx.amountKobo) {
    await prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: { status: "FAILED", raw: verified.raw as object },
    });
    const t = templates.paymentFailed(result.user.name ?? "there");
    await sendEmail({ to: result.user.email, subject: t.subject, html: t.html });
    return error("PAYMENT_FAILED", "Payment was not successful.", 402);
  }

  const paidAt = verified.paidAt ? new Date(verified.paidAt) : new Date();
  const currentTo = new Date(paidAt);
  currentTo.setDate(currentTo.getDate() + 30);
  const premium = await prisma.plan.findUnique({ where: { key: "PREMIUM" } });
  await prisma.$transaction([
    prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: { status: "SUCCESS", verifiedAt: new Date(), raw: verified.raw as object },
    }),
    ...(premium
      ? [
          prisma.subscription.create({
            data: { userId: result.user.id, planId: premium.id, status: "ACTIVE", currentTo },
          }),
        ]
      : []),
  ]);
  const t = templates.paymentSuccess(result.user.name ?? "there", "Premium");
  await sendEmail({ to: result.user.email, subject: t.subject, html: t.html });
  return success({ verified: true });
}
