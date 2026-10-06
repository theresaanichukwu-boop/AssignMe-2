import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";

const tabs = [
  ["overview", "Overview"],
  ["build", "Build"],
  ["research", "Research"],
  ["editor", "Editor"],
  ["reviewer", "Reviewer"],
  ["sources", "Sources"],
  ["versions", "Versions"],
  ["export", "Export"],
] as const;

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const workspace = await prisma.workspace.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, title: true },
  });
  if (!workspace) notFound();

  return (
    <div className="flex min-h-screen">
      <nav aria-label="Workspace" className="w-60 shrink-0 border-r border-navy-100 bg-navy-950 p-4 text-white">
        <a href="/my-work" className="text-xs text-navy-100 hover:underline">
          ← My Work
        </a>
        <p className="mt-2 line-clamp-2 font-serif text-lg">{workspace.title}</p>
        <ul className="mt-4 space-y-1">
          {tabs.map(([key, label]) => (
            <li key={key}>
              <a
                href={`/workspaces/${workspace.id}/${key}`}
                className="block rounded-md px-3 py-2 text-sm hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-teal-100"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0 flex-1">
        <main id="main-content" className="mx-auto w-full max-w-4xl px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
