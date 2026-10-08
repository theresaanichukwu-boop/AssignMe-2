import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/payments/paystack";
import { sendEmail, templates } from "@/lib/email/resend";

// Paystack webhook: raw-body signature check BEFORE parsing (PRD §24).
// Idempotent: SUCCESS transactions are never applied twice.
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!verifyWebhookSignature(raw, signature)) {
    return Response.json({ ok: false, error: { code: "FORBIDDEN", message: "Invalid signature." } }, { status: 403 });
  }

  let event: { event?: string; data?: { reference?: string; status?: string; amount?: number; paid_at?: string | null } };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: { code: "VALIDATION", message: "Invalid payload." } }, { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    const tx = await prisma.paymentTransaction.findUnique({
      where: { paystackReference: event.data.reference },
      include: { user: true },
    });
    if (tx && tx.status !== "SUCCESS") {
      const premium = await prisma.plan.findUnique({ where: { key: "PREMIUM" } });
      const currentTo = new Date();
      currentTo.setDate(currentTo.getDate() + 30);
      await prisma.$transaction([
        prisma.paymentTransaction.update({
          where: { id: tx.id },
          data: { status: "SUCCESS", verifiedAt: new Date(), raw: (event.data ?? {}) as object },
        }),
        ...(premium
          ? [prisma.subscription.create({ data: { userId: tx.userId, planId: premium.id, status: "ACTIVE", currentTo } })]
          : []),
      ]);
      const t = templates.paymentSuccess(tx.user.name ?? "there", "Premium");
      await sendEmail({ to: tx.user.email, subject: t.subject, html: t.html });
    }
  } else if (event.event === "charge.failed" && event.data?.reference) {
    const tx = await prisma.paymentTransaction.findUnique({
      where: { paystackReference: event.data.reference },
      include: { user: true },
    });
    if (tx && tx.status === "PENDING") {
      await prisma.paymentTransaction.update({ where: { id: tx.id }, data: { status: "FAILED" } });
      const t = templates.paymentFailed(tx.user.name ?? "there");
      await sendEmail({ to: tx.user.email, subject: t.subject, html: t.html });
    }
  }

  return Response.json({ ok: true, data: { received: true } });
}
