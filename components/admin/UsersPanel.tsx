"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Fields";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export function UsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState("");

  async function refresh() {
    const res = await fetch("/api/admin/users");
    const json = await res.json();
    if (json.ok) setUsers(json.data.users);
    else setStatus(json.error?.message ?? "Forbidden.");
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <Card title={`Users (${users.length})`}>
      {status && <p role="alert" className="mt-2 text-sm text-red-700">{status}</p>}
      <ul className="mt-3 space-y-2">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-navy-100 px-3 py-2 text-sm">
            <span>
              <span className="font-medium">{u.name ?? "—"}</span>{" "}
              <span className="text-slate-500">{u.email}</span>
            </span>
            <Select
              label={`Role for ${u.email}`}
              value={u.role}
              onChange={(e) => {
                const role = e.target.value;
                fetch("/api/admin/users", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: u.id, role }),
                })
                  .then((r) => r.json())
                  .then((j) => {
                    if (j.ok) setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, role } : p)));
                    else setStatus(j.error?.message ?? "Update failed.");
                  });
              }}
              options={["STUDENT", "ADMIN", "CONTENT_MANAGER", "SUPPORT"].map((r) => ({ value: r, label: r }))}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
