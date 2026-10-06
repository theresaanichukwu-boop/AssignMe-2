import { EmptyState } from "@/components/ui/Feedback";

export function PhaseStub({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">{title}</h1>
      <EmptyState title="Coming in a later phase" body={body} />
    </div>
  );
}
