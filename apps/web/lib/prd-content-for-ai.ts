const MAX_PRD_CHARS = 14_000;
const MIN_CHARS_FOR_AI_SPLIT = 80;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 20)}\n…[truncated]`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sectionTitle(section: Record<string, unknown>): string {
  if (typeof section.title === 'string' && section.title.trim()) return section.title.trim();
  if (typeof section.id === 'string' && section.id.trim()) return section.id.trim();
  return 'Section';
}

function firstSentence(text: string, max = 280): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^[\s\S]*?[.!?](?:\s|$)/);
  const sentence = match?.[0]?.trim() ?? trimmed;
  return truncate(sentence, max);
}

export type PrdSplitReadiness = {
  filledSectionCount: number;
  totalCharCount: number;
  isReadyForAiSplit: boolean;
  message: string;
};

export type TemplateClusterDraft = {
  sortOrder: number;
  label: string;
  valueLine: string;
  boundaryCue: string;
};

function collectFilledSections(prdContent: unknown): Array<{ title: string; content: string }> {
  if (!isRecord(prdContent)) return [];

  const sections = prdContent.sections;
  if (Array.isArray(sections) && sections.length > 0) {
    return sections.flatMap((section) => {
      if (!isRecord(section)) return [];
      const content = typeof section.content === 'string' ? section.content.trim() : '';
      if (!content) return [];
      return [{ title: sectionTitle(section), content }];
    });
  }

  return Object.entries(prdContent).flatMap(([key, value]) => {
    if (key === 'title' || key === 'version_summary' || key === 'sections') return [];
    const content = typeof value === 'string' ? value.trim() : value == null ? '' : JSON.stringify(value);
    if (!content) return [];
    return [{ title: key, content }];
  });
}

/** Compact PRD text for AI prompts — avoids huge pretty-printed JSON payloads. */
export function formatPrdContentForAi(prdContent: unknown): string {
  if (prdContent == null) return '(empty PRD)';

  if (isRecord(prdContent)) {
    const lines: string[] = [];

    if (typeof prdContent.title === 'string' && prdContent.title.trim()) {
      lines.push(`# ${prdContent.title.trim()}`);
    }
    if (typeof prdContent.version_summary === 'string' && prdContent.version_summary.trim()) {
      lines.push(`Summary: ${prdContent.version_summary.trim()}`);
    }

    for (const section of collectFilledSections(prdContent)) {
      lines.push(`\n## ${section.title}\n${section.content}`);
    }

    const formatted = lines.join('\n').trim();
    if (formatted) return truncate(formatted, MAX_PRD_CHARS);
  }

  return truncate(JSON.stringify(prdContent), MAX_PRD_CHARS);
}

export function assessPrdSplitReadiness(prdContent: unknown): PrdSplitReadiness {
  const filledSections = collectFilledSections(prdContent);
  const formatted = formatPrdContentForAi(prdContent);

  if (filledSections.length === 0 || formatted === '(empty PRD)') {
    return {
      filledSectionCount: 0,
      totalCharCount: formatted.length,
      isReadyForAiSplit: false,
      message:
        'Your PRD has no filled sections yet. Open the project workspace, run clarification, then generate or capture a PRD.',
    };
  }

  if (formatted.length < MIN_CHARS_FOR_AI_SPLIT) {
    return {
      filledSectionCount: filledSections.length,
      totalCharCount: formatted.length,
      isReadyForAiSplit: false,
      message:
        'Your PRD is too short for AI splitting. Add more detail in the workspace, or use “From PRD sections” to draft clusters manually.',
    };
  }

  return {
    filledSectionCount: filledSections.length,
    totalCharCount: formatted.length,
    isReadyForAiSplit: true,
    message: '',
  };
}

/** One editable cluster per filled PRD section — no AI, instant field-by-field draft. */
export function buildTemplateClustersFromPrd(prdContent: unknown): TemplateClusterDraft[] {
  return collectFilledSections(prdContent).map((section, index) => ({
    sortOrder: index,
    label: truncate(section.title, 500),
    valueLine: firstSentence(section.content, 2000) || truncate(section.content, 2000),
    boundaryCue: 'Refine what this cluster excludes compared to the other PRD areas.',
  }));
}
