import { Card } from "@/components/ui/Card";

export default function AdminOverview() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Administration</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Users & roles">
          <p className="mt-2 text-sm text-slate-600">Manage accounts and assign Student, Admin, Content Manager, or Support roles.</p>
          <a href="/admin/users" className="mt-2 inline-block text-sm font-medium text-teal-800 hover:underline">Open →</a>
        </Card>
        <Card title="Subscriptions & payments">
          <p className="mt-2 text-sm text-slate-600">Trials, subscriptions, and Paystack transaction records.</p>
          <a href="/admin/subscriptions" className="mt-2 inline-block text-sm font-medium text-teal-800 hover:underline">Open →</a>
        </Card>
        <Card title="Academic content">
          <p className="mt-2 text-sm text-slate-600">Discipline packs and work-type templates (Content Managers included).</p>
          <a href="/admin/disciplines" className="mt-2 inline-block text-sm font-medium text-teal-800 hover:underline">Open →</a>
        </Card>
        <Card title="Support queue">
          <p className="mt-2 text-sm text-slate-600">Triage tickets, set priority, resolve.</p>
          <a href="/admin/tickets" className="mt-2 inline-block text-sm font-medium text-teal-800 hover:underline">Open →</a>
        </Card>
      </div>
    </div>
  );
}
