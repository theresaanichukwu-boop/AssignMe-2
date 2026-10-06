import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { ProfileForm } from "@/components/settings/ProfileForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <AppShell title="Settings" sidebarActive="Settings">
      <Card title="Academic profile">
        <div className="mt-4">
          <ProfileForm
            initial={{
              institution: profile?.institution ?? null,
              faculty: profile?.faculty ?? null,
              department: profile?.department ?? null,
              programme: profile?.programme ?? null,
              academicLevel: profile?.academicLevel ?? null,
              course: profile?.course ?? null,
              discipline: profile?.discipline ?? null,
              country: profile?.country ?? null,
              citationStyle: profile?.citationStyle ?? "APA_7",
              supervisor: profile?.supervisor ?? null,
            }}
          />
        </div>
      </Card>
    </AppShell>
  );
}
