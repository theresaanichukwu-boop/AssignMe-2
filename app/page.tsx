import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { Button } from "../components/ui/Button";

export default async function Home() {
  const session = await getSession();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium text-teal-700">AssignMe</p>
      <h1 className="mt-2 font-serif text-4xl">
        Academic workspace with an intelligent supervisor
      </h1>
      <p className="mt-4 text-slate-600">
        Plan, research, write, review, and export academic work with verified sources.
      </p>
      <div className="mt-6 flex gap-2">
        <a href="/register">
          <Button>Get started</Button>
        </a>
        <a href="/login">
          <Button variant="secondary">Sign in</Button>
        </a>
      </div>
    </main>
  );
}
