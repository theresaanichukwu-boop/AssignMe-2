import { AppShell } from "../components/layout/AppShell";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, Alert } from "../components/ui/Card";
import { UsageMeter, Stepper } from "../components/ui/Feedback";
import { SourceCard } from "../components/academic/Evidence";
import { AIResponseCard } from "../components/academic/Review";

export default function Home() {
  return (
    <AppShell title="Dashboard" sidebarActive="Dashboard">
      <p className="text-sm font-medium text-teal-700">AssignMe · Phase 2</p>
      <h2 className="mt-2 font-serif text-4xl">Academic workspace with an intelligent supervisor</h2>
      <p className="mt-4 max-w-2xl text-slate-600">
        Design system live: centralized tokens, reusable components, and WCAG 2.2 AA
        patterns. Full preview in <code className="font-mono text-sm">design.html</code>.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card title="Workflow">
          <div className="mt-3">
            <Stepper
              steps={["Understand", "Research", "Draft", "Review", "Export"]}
              current={2}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button>Continue drafting</Button>
            <Button variant="secondary">View research</Button>
            <Button variant="ghost">Skip</Button>
          </div>
        </Card>
        <UsageMeter used={7} limit={20} label="AI generations" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>APA 7</Badge>
        <Badge tone="success">VERIFIED</Badge>
        <Badge tone="warning">NEEDS REVIEW</Badge>
        <Badge tone="accent">2021–2026</Badge>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SourceCard
          source={{
            title: "Example verified source (placeholder — never fabricated in product)",
            authors: ["A. Researcher", "B. Scholar"],
            year: 2024,
            publication: "Journal of Examples",
            doi: "10.0000/example",
            verification: "VERIFIED",
          }}
        />
        <AIResponseCard
          status="NEEDS_REVIEW"
          answer="This draft section demonstrates the AI response card pattern."
          rationale="Structured rationale ships with every response instead of chain-of-thought."
          warnings={["2 claims need evidence-pool support before export."]}
          nextStep="Attach two verified sources, then regenerate."
        />
      </div>

      <div className="mt-4">
        <Alert tone="info">
          Standalone component preview: open <code className="font-mono">design.html</code> in a
          browser — no app server required.
        </Alert>
      </div>
    </AppShell>
  );
}
