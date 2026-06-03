import type { PrdVersionContent } from '@repo/contracts/prd';
import {
  IMPORTED_PRD_ALLOWED_EXTENSIONS,
  IMPORTED_PRD_MAX_BYTES,
  type ImportedPrdAllowedExtension,
} from '@repo/contracts/project/prd-import-at-create';

export type ParsedImportFile = {
  text: string;
  filename: string;
  extension: ImportedPrdAllowedExtension;
};

export function normalizeImportFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name;
  return base.trim();
}

export function getImportFileExtension(filename: string): ImportedPrdAllowedExtension | null {
  const lower = filename.toLowerCase();
  const match = IMPORTED_PRD_ALLOWED_EXTENSIONS.find((ext) => lower.endsWith(ext));
  return match ?? null;
}

export function validateImportedPrdText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return 'Imported PRD content is empty';
  const bytes = new TextEncoder().encode(trimmed).byteLength;
  if (bytes > IMPORTED_PRD_MAX_BYTES) {
    return `Imported PRD exceeds ${Math.floor(IMPORTED_PRD_MAX_BYTES / (1024 * 1024))} MB limit`;
  }
  return null;
}

export function parseImportedPrdUploadFile(file: File): Promise<ParsedImportFile> {
  const filename = normalizeImportFilename(file.name);
  const extension = getImportFileExtension(filename);
  if (!extension) {
    return Promise.reject(new Error('Only .md and .txt files are supported'));
  }
  if (file.size > IMPORTED_PRD_MAX_BYTES) {
    return Promise.reject(
      new Error(`File exceeds ${Math.floor(IMPORTED_PRD_MAX_BYTES / (1024 * 1024))} MB limit`)
    );
  }
  return file.text().then((text) => {
    const validationError = validateImportedPrdText(text);
    if (validationError) {
      return Promise.reject(new Error(validationError));
    }
    return { text: text.trim(), filename, extension };
  });
}

/** Store imported body as a single readable PRD section (works with existing PRD viewer). */
export function buildImportedPrdVersionContent(
  body: string,
  projectName: string,
  meta: { format: 'paste' | 'upload'; filename?: string }
): PrdVersionContent {
  const trimmed = body.trim();
  const fileHint =
    meta.format === 'upload' && meta.filename ? ` (file: ${meta.filename})` : '';
  return {
    title: projectName.trim() || 'Imported PRD',
    version_summary: `Imported external PRD${fileHint}. You can refine or generate a new version from Clarify.`,
    sections: [
      {
        id: 'imported_content',
        title: 'Imported content',
        content: trimmed,
        confidence: 'medium',
        open_questions: [],
      },
    ],
  };
}
