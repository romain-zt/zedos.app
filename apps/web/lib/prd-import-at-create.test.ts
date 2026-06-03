import { describe, it, expect } from 'vitest';
import {
  buildImportedPrdVersionContent,
  getImportFileExtension,
  validateImportedPrdText,
} from './prd-import-at-create';

describe('getImportFileExtension', () => {
  it('accepts .md and .txt', () => {
    expect(getImportFileExtension('notes.md')).toBe('.md');
    expect(getImportFileExtension('PRD.TXT')).toBe('.txt');
  });

  it('rejects other extensions', () => {
    expect(getImportFileExtension('doc.pdf')).toBeNull();
  });
});

describe('validateImportedPrdText', () => {
  it('rejects empty content', () => {
    expect(validateImportedPrdText('  ')).toMatch(/empty/i);
  });

  it('accepts trimmed markdown', () => {
    expect(validateImportedPrdText('# Title\n\nContent')).toBeNull();
  });
});

describe('buildImportedPrdVersionContent', () => {
  it('produces AI-shaped PRD with imported section', () => {
    const content = buildImportedPrdVersionContent('Hello PRD', 'My App', { format: 'paste' });
    expect(content).toMatchObject({
      title: 'My App',
      sections: [{ id: 'imported_content', content: 'Hello PRD' }],
    });
  });
});
