import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./db";
import { ensureTrial } from "./billing/entitlement";
import { sendEmail, templates } from "./email/resend";

// Verified against better-auth@1.7.7: betterAuth + prismaAdapter(prisma,
// { provider }) + emailAndPassword + nextCookies + toNextJsHandler.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  // Production (Docker/Netlify) must set APP_URL to the public origin.
  // Without it, better-auth cannot validate request origins and rejects
  // auth mutations with INVALID_ORIGIN. Local dev works without it.
  baseURL: process.env.APP_URL || undefined,
  trustedOrigins: process.env.APP_URL ? [process.env.APP_URL] : [],
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
