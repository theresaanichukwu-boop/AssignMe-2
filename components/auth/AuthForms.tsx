"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      aria-label="Sign in"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setErr(null);
        const res = await authClient.signIn.email({ email, password });
        setLoading(false);
        if (res.error) {
          setErr(res.error.message ?? "Sign in failed.");
          return;
        }
        router.push("/dashboard");
        router.refresh();
      }}
      className="space-y-4"
    >
      <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      {err && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </p>
      )}
      <Button type="submit" loading={loading} className="w-full">
        Sign in
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      aria-label="Create account"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setErr(null);
        const res = await authClient.signUp.email({ email, password, name });
        setLoading(false);
        if (res.error) {
          setErr(res.error.message ?? "Registration failed.");
          return;
        }
        router.push("/dashboard");
        router.refresh();
      }}
      className="space-y-4"
    >
      <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input
        label="Password"
        type="password"
        required
        minLength={8}
        hint="Minimum 8 characters."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {err && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </p>
      )}
      <Button type="submit" loading={loading} className="w-full">
        Create account
      </Button>
    </form>
  );
}
