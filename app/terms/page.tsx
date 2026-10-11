export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl">Terms of Use</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: October 2026</p>
      <div className="prose mt-6 space-y-4 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-navy-950">The service</h2>
          <p>
            AssignMe is an AI-assisted academic workspace for planning, research,
            writing, reviewing, and citation management. It behaves like a
            strict supervisor: it challenges weak reasoning and flags
            uncertainty, but all academic decisions remain yours.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-navy-950">Academic integrity</h2>
          <p>
            You are responsible for checking your institution's AI and
            academic-integrity policies before submitting any work produced with
            AssignMe. We make no promises about grades, originality scores, or
            AI-detector outcomes.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-navy-950">Acceptable use</h2>
          <p>
            Do not abuse the service, attack other users' data, share your
            account, or use the service for unlawful purposes. We may suspend
            accounts that do.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-navy-950">Plans and payments</h2>
          <p>
            Free, Premium, and trial limits are shown on the Billing page.
            Payments are processed by Paystack in test mode during this phase;
            subscriptions activate only after server-side verification.
          </p>
        </section>
      </div>
    </main>
  );
}
