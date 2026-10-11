import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./db";
import { ensureTrial } from "./billing/entitlement";
import { sendEmail, templates } from "./email/resend";

// Verified against better-auth@1.7.7: betterAuth + prismaAdapter(prisma,
// { provider }) + emailAndPassword + nextCookies + toNextJsHandler.
function trustedOrigins(): string[] {
  // Platforms provide their own URL; accept all of them so a mistyped or
  // missing APP_URL can never lock users out with INVALID_ORIGIN.
  // Vercel sets VERCEL_URL (this deployment) and VERCEL_PROJECT_PRODUCTION_URL
  // (the stable address users visit); Netlify sets URL + DEPLOY_PRIME_URL.
  const raw = [
    process.env.APP_URL ?? "",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "",
    process.env.URL ?? "",
    process.env.DEPLOY_PRIME_URL ?? "",
  ];
  const clean = raw.map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean);
  return [...new Set(clean)];
}

const appUrl = (process.env.APP_URL ?? "").trim().replace(/\/+$/, "") || undefined;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  // Production must be reachable at one of these origins. Platform-provided
  // URLs are included so auth never breaks from a mistyped APP_URL.
  baseURL: appUrl,
  trustedOrigins: trustedOrigins(),
  databaseHooks: {
    user: {
      create: {
        // Never blocks signup: trial + email failures are caught and logged.
        after: async (user) => {
          try {
            await ensureTrial(user.id);
            await prisma.usageEvent.create({
              data: { userId: user.id, type: "account.create", count: 1 },
            });
            const t = templates.welcome(user.name || "there");
            await sendEmail({ to: user.email, subject: t.subject, html: t.html });
          } catch (e) {
            console.error("[signup-hook]", (e as Error).message);
          }
        },
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "STUDENT",
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
