import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { VerifyPanel } from "@/components/billing/VerifyPanel";

export default function BillingVerifyPage() {
  return (
    <AppShell title="Payment verification" sidebarActive="Billing">
      <Suspense fallback={<p className="text-sm text-slate-500">Verifying…</p>}>
        <VerifyPanel />
      </Suspense>
    </AppShell>
  );
}
