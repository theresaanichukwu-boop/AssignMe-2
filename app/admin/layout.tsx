import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";

const links = [
  ["Overview", "/admin"],
  ["Users", "/admin/users"],
  ["Subscriptions", "/admin/subscriptions"],
  ["Disciplines", "/admin/disciplines"],
  ["Support", "/admin/tickets"],
  ["Audit & usage", "/admin/audit"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role = ((session?.user as { role?: string } | undefined)?.role ?? "STUDENT") as string;
  if (!session?.user || (role !== "ADMIN" && role !== "CONTENT_MANAGER" && role !== "SUPPORT")) {
    redirect("/dashboard");
  }
  return (
    <div className="flex min-h-screen">
      <nav aria-label="Admin" className="w-60 shrink-0 border-r border-navy-100 bg-navy-950 p-4 text-white">
        <p className="px-2 font-serif text-lg">Admin</p>
        <ul className="mt-4 space-y-1">
          {links.map(([label, href]) => (
            <li key={href}>
              <a href={href} className="block rounded-md px-3 py-2 text-sm hover:bg-navy-800">
                {label}
              </a>
            </li>
          ))}
        </ul>
        <a href="/dashboard" className="mt-6 block px-3 text-xs text-navy-100 hover:underline">
          ← Back to app
        </a>
      </nav>
      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
