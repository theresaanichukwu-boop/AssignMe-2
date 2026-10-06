import { RegisterForm } from "@/components/auth/AuthForms";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <p className="font-serif text-3xl">AssignMe</p>
      <h1 className="mt-2 text-xl font-semibold">Create your account</h1>
      <div className="mt-6">
        <RegisterForm />
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Have an account? <a href="/login" className="text-teal-800 hover:underline">Sign in</a>.
      </p>
    </main>
  );
}
