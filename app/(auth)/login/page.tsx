import { LoginForm } from "@/components/auth/AuthForms";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <p className="font-serif text-3xl">AssignMe</p>
      <h1 className="mt-2 text-xl font-semibold">Sign in to your workspace</h1>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-4 text-sm text-slate-500">
        No account? <a href="/register" className="text-teal-800 hover:underline">Create one</a>.
      </p>
    </main>
  );
}
