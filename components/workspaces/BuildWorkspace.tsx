"use client";

import { useState } from "react";
import { TopicHelper, MainBuild, type MainBuildData } from "./MainBuild";
import { SectionWorkbench, type Section } from "./SectionWorkbench";

export function BuildWorkspace({
  workspaceId,
  initial,
  initialSections,
  templateSections,
}: {
  workspaceId: string;
  initial: MainBuildData;
  initialSections: Section[];
  templateSections: string[];
}) {
  const [data, setData] = useState<MainBuildData>(initial);
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [topicDraft, setTopicDraft] = useState<string | null>(null);
  const [objectivesDraft, setObjectivesDraft] = useState<string[] | null>(null);

  async function refresh() {
    const res = await fetch(`/api/workspaces/${workspaceId}`);
    const json = await res.json();
    if (!json.ok) return;
    const w = json.data.workspace;
    setData((d) => ({
      ...d,
      title: w.title,
      topic: w.topic,
      objectives: w.objectives ?? [],
      course: w.course,
      academicLevel: w.academicLevel,
      instructions: w.instructions ?? "",
      sourceYearFrom: w.sourceYearFrom,
      sourceYearTo: w.sourceYearTo,
    }));
    setSections(
      (w.sections ?? []).map((s: Section) => ({
        id: s.id, key: s.key, title: s.title, content: s.content, order: s.order,
      }))
    );
  }

  return (
    <div className="space-y-4">
      <TopicHelper
        workspaceId={workspaceId}
        workType={data.workType}
        onUseTopic={(t) => setTopicDraft(t)}
        onUseObjectives={(o) => setObjectivesDraft(o)}
      />
      <MainBuild
        workspaceId={workspaceId}
        initial={data}
        onSaved={(d) => setData(d)}
        topicDraft={topicDraft}
        objectivesDraft={objectivesDraft}
        onDraftConsumed={() => {
          setTopicDraft(null);
          setObjectivesDraft(null);
        }}
      />
      <SectionWorkbench
        workspaceId={workspaceId}
        workType={data.workType}
        topic={data.topic}
        sections={sections}
        templateSections={templateSections}
        onChanged={() => void refresh()}
      />
    </div>
  );
}
