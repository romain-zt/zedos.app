import type { GeneratePrdSection } from '@repo/contracts/ai/generate-prd-stream';
import type { PrdVersionContent } from '@repo/contracts/prd';
import { formatPrdContentForAi } from '@/lib/prd-content-for-ai';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isGeneratedContent(
  content: PrdVersionContent
): content is PrdVersionContent & { title: string; sections: GeneratePrdSection[] } {
  return 'title' in content && 'sections' in content && Array.isArray(content.sections);
}

export function buildPrdPrintHtml(params: {
  title: string;
  versionNumber: number;
  content: PrdVersionContent | null;
}): string {
  const { title, versionNumber, content } = params;
  const bodyParts: string[] = [];

  if (content && isGeneratedContent(content)) {
    if ('version_summary' in content && content.version_summary?.trim()) {
      bodyParts.push(`<p class="summary">${escapeHtml(content.version_summary.trim())}</p>`);
    }
    for (const section of content.sections) {
      const heading = escapeHtml(section.title?.trim() || 'Section');
      const sectionBody = escapeHtml(section.content?.trim() || '').replace(/\n/g, '<br/>');
      bodyParts.push(`<section><h2>${heading}</h2><div class="section-body">${sectionBody}</div></section>`);
    }
  } else if (content) {
    const markdown = formatPrdContentForAi(content);
    bodyParts.push(
      `<pre class="fallback">${escapeHtml(markdown).replace(/\n/g, '<br/>')}</pre>`
    );
  } else {
    bodyParts.push('<p class="empty">(empty PRD)</p>');
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(title)} — v${versionNumber}</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #111; line-height: 1.5; max-width: 720px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .meta { color: #555; font-size: 0.9rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.15rem; margin-top: 1.25rem; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem; }
    .summary { font-style: italic; color: #333; }
    .section-body { margin-top: 0.5rem; }
    .fallback { white-space: pre-wrap; font-family: ui-monospace, monospace; font-size: 0.85rem; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">Version ${versionNumber} — Zedos PRD export</p>
  ${bodyParts.join('\n')}
  <script>window.addEventListener('load', () => { window.print(); });</script>
</body>
</html>`;
}
