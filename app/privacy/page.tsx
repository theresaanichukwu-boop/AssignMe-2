export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: October 2026</p>
      <div className="prose mt-6 space-y-4 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-navy-950">What we collect</h2>
          <p>
            Your account details (name, email), academic profile, workspaces and
            their contents, uploaded files, support tickets, and records of
            feature usage and payments. We collect only what the service needs.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-navy-950">How it is used</h2>
          <p>
            To operate your workspace, generate drafts and reviews with the AI
            provider (Google Gemini), verify payments (Paystack), send emails
            (Resend), and store files (Backblaze B2). Your work is never sold
            and never automatically used to train models.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-navy-950">Your control</h2>
          <p>
            You can export your work at any time. To request correction or
            deletion of your data, contact support through the in-app Support
            page. AI failures and privacy concerns can be reported there too.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-navy-950">Security</h2>
          <p>
            Accounts are password-protected, every request checks ownership,
            files are private with time-limited access links, and payment
            details are processed by Paystack — we never see card numbers.
          </p>
        </section>
      </div>
    </main>
  );
}
