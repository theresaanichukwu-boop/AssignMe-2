import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { AppShell } from "@/components/layout/AppShell";
import { BillingPanel } from "@/components/billing/BillingPanel";

export default async function BillingPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return (
    <AppShell title="Billing" sidebarActive="Billing">
      <BillingPanel />
    </AppShell>
  );
}
