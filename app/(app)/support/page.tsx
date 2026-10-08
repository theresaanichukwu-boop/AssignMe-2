import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { AppShell } from "@/components/layout/AppShell";
import { SupportPanel } from "@/components/support/SupportPanel";

export default async function SupportPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return (
    <AppShell title="Support" sidebarActive="Support">
      <SupportPanel />
    </AppShell>
  );
}
