import { describe, it, expect } from 'vitest';
import {
  CreateProjectImportPasteSchema,
  ImportedPrdPasteSchema,
  IMPORTED_PRD_MAX_BYTES,
} from './prd-import-at-create';

describe('ImportedPrdPasteSchema', () => {
  it('rejects empty paste', () => {
    const r = ImportedPrdPasteSchema.safeParse({ kind: 'paste', text: '   ' });
    expect(r.success).toBe(false);
  });

  it('accepts non-empty paste under size limit', () => {
    const r = ImportedPrdPasteSchema.safeParse({ kind: 'paste', text: '# My PRD\n\nVision...' });
    expect(r.success).toBe(true);
  });

  it('rejects paste over max bytes', () => {
    const r = ImportedPrdPasteSchema.safeParse({
      kind: 'paste',
      text: 'x'.repeat(IMPORTED_PRD_MAX_BYTES + 1),
    });
    expect(r.success).toBe(false);
  });
});

describe('CreateProjectImportPasteSchema', () => {
  it('requires project name with import', () => {
    const r = CreateProjectImportPasteSchema.safeParse({
      name: 'Imported',
      import: { kind: 'paste', text: 'Body' },
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.journeyMode).toBe('standard');
  });
});
