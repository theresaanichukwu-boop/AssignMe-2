// Resend email delivery (PRD §25). Credentials stay server-side.
// When unconfigured, sends are skipped (logged) — never fatal.

const BASE = "https://api.resend.com/emails";

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: EmailParams): Promise<{ sent: boolean; id?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email:skip] to=${params.to} subject=${params.subject} (RESEND_API_KEY unset)`);
    return { sent: false };
  }
  const from = process.env.EMAIL_FROM ?? "AssignMe <noreply@assignme.app>";
  const res = await fetch(BASE, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text ?? params.html.replace(/<[^>]+>/g, ""),
    }),
  });
  if (!res.ok) {
    console.error(`[email:fail] to=${params.to} status=${res.status}`);
    return { sent: false };
  }
  const json = (await res.json()) as { id?: string };
  return { sent: true, id: json.id };
}

export const templates = {
  welcome: (name: string) => ({
    subject: "Welcome to AssignMe",
    html: `<p>Hello ${name},</p><p>Your academic workspace is ready. You are on a one-month Premium trial — research verified sources, draft section by section, and export when ready.</p>`,
  }),
  trialEnding: (name: string, daysLeft: number) => ({
    subject: "Your AssignMe trial ends soon",
    html: `<p>Hello ${name},</p><p>Your Premium trial ends in ${daysLeft} day(s). Upgrade to keep higher limits.</p>`,
  }),
  paymentSuccess: (name: string, plan: string) => ({
    subject: "Payment confirmed — welcome to Premium",
    html: `<p>Hello ${name},</p><p>Your payment was verified and <strong>${plan}</strong> is now active. Thank you.</p>`,
  }),
  paymentFailed: (name: string) => ({
    subject: "Your AssignMe payment did not complete",
    html: `<p>Hello ${name},</p><p>Your payment could not be completed. No charge was made — please try again.</p>`,
  }),
  ticketUpdate: (subject: string, status: string) => ({
    subject: `Support update: ${subject}`,
    html: `<p>Your support ticket “${subject}” is now <strong>${status}</strong>.</p>`,
  }),
};
