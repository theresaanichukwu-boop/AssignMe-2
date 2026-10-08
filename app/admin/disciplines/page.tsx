import { DisciplinesPanel } from "@/components/admin/DisciplinesPanel";

export default function AdminDisciplinesPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Academic content</h1>
      <DisciplinesPanel />
    </div>
  );
}
