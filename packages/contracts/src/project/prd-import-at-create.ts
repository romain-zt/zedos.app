import { z } from 'zod';

/** OQ-IMP-001: max uploaded file size for v0 import. */
export const IMPORTED_PRD_MAX_BYTES = 2 * 1024 * 1024;

/** OQ-IMP-001: allowed upload extensions (lowercase, with dot). */
export const IMPORTED_PRD_ALLOWED_EXTENSIONS = ['.md', '.txt'] as const;

export type ImportedPrdAllowedExtension = (typeof IMPORTED_PRD_ALLOWED_EXTENSIONS)[number];

export const ImportedPrdPasteSchema = z.object({
  kind: z.literal('paste'),
  text: z
    .string()
    .transform((v) => v.trim())
    .pipe(
      z
        .string()
        .min(1, 'Paste content is required')
        .max(IMPORTED_PRD_MAX_BYTES, 'Imported PRD text is too large')
    ),
});

export type ImportedPrdPaste = z.infer<typeof ImportedPrdPasteSchema>;

export const CreateProjectImportPasteSchema = z.object({
  name: z.string().min(1, 'Project name is required').transform((v) => v.trim()),
  description: z
    .string()
    .optional()
    .nullable()
    .transform((v) => v?.trim() ?? null),
  journeyMode: z.enum(['standard', 'express']).optional().default('standard'),
  import: ImportedPrdPasteSchema,
});

export type CreateProjectImportPaste = z.infer<typeof CreateProjectImportPasteSchema>;
