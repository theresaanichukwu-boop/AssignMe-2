import { TicketsPanel } from "@/components/admin/TicketsPanel";

export default function AdminTicketsPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Support queue</h1>
      <TicketsPanel />
    </div>
  );
}
