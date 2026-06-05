import type { TemplateDetail, TemplateSummary } from '@domain/templates/template';
import type {
  TemplateDetailDTO,
  TemplateSummaryDTO,
} from '@repo/contracts/templates';

export function toTemplateSummaryDTO(summary: TemplateSummary): TemplateSummaryDTO {
  return {
    slug: summary.slug,
    title: summary.title,
    description: summary.description,
    category: summary.category,
    journeyHint: summary.journeyHint,
    sector: summary.sector,
    author: summary.author,
    forkCount: summary.forkCount,
  };
}

export function toTemplateDetailDTO(detail: TemplateDetail): TemplateDetailDTO {
  return {
    ...toTemplateSummaryDTO(detail),
    sectionsOutline: detail.sectionsOutline.map((entry) => ({
      id: entry.id,
      title: entry.title,
    })),
    clarifyHints: [...detail.clarifyHints],
    content: {
      title: detail.content.title,
      version_summary: detail.content.version_summary,
      sections: detail.content.sections.map((section) => ({
        id: section.id,
        title: section.title,
        content: section.content,
        confidence: section.confidence,
        open_questions: [...section.open_questions],
      })),
    },
  };
}
