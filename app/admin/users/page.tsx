import { UsersPanel } from "@/components/admin/UsersPanel";

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Users</h1>
      <UsersPanel />
    </div>
  );
}
