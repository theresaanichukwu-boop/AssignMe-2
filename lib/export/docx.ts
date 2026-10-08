import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { formatCitation, type CitationStyle } from "@/lib/citations/format";

export interface ExportSection {
  title: string;
  content: string;
}

export interface ExportSource {
  title: string;
  authors: string[];
  year: number | null;
  publication: string | null;
  doi: string | null;
  url: string | null;
}

export async function buildDocx(params: {
  title: string;
  topic: string;
  objectives: string[];
  sections: ExportSection[];
  sources: ExportSource[];
  citationStyle: CitationStyle;
}): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({ text: params.title, heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: params.topic, italics: true })] }),
  ];

  if (params.objectives.length > 0) {
    children.push(new Paragraph({ text: "Objectives", heading: HeadingLevel.HEADING_1 }));
    for (const o of params.objectives) {
      children.push(new Paragraph({ text: o, bullet: { level: 0 } }));
    }
  }

  for (const s of params.sections) {
    children.push(new Paragraph({ text: s.title, heading: HeadingLevel.HEADING_1 }));
    for (const para of s.content.split(/\n{2,}|\r?\n/).map((p) => p.trim()).filter(Boolean)) {
      children.push(new Paragraph({ text: para }));
    }
  }

  if (params.sources.length > 0) {
    children.push(new Paragraph({ text: "References", heading: HeadingLevel.HEADING_1 }));
    params.sources.forEach((s, i) => {
      children.push(new Paragraph({ text: formatCitation(params.citationStyle, s, i + 1) }));
    });
  }

  const doc = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}
