import { describe, expect, it } from 'vitest';
import {
  assessPrdSplitReadiness,
  buildTemplateClustersFromPrd,
  formatPrdContentForAi,
} from '@/lib/prd-content-for-ai';

describe('formatPrdContentForAi', () => {
  it('formats structured PRD sections as compact markdown', () => {
    const formatted = formatPrdContentForAi({
      title: 'My Product',
      version_summary: 'MVP scope',
      sections: [
        { id: 'vision', title: 'Product Vision', content: 'Help founders ship faster.' },
        { id: 'core_features', title: 'Core Features', content: 'Project workspace and PRD.' },
      ],
    });

    expect(formatted).toContain('# My Product');
    expect(formatted).toContain('Summary: MVP scope');
    expect(formatted).toContain('## Product Vision');
    expect(formatted).toContain('Help founders ship faster.');
    expect(formatted).not.toContain('"sections"');
  });

  it('truncates oversized PRD content', () => {
    const formatted = formatPrdContentForAi({
      sections: [{ id: 'vision', title: 'Vision', content: 'x'.repeat(20_000) }],
    });

    expect(formatted.length).toBeLessThanOrEqual(14_000);
    expect(formatted).toContain('[truncated]');
  });
});

describe('assessPrdSplitReadiness', () => {
  it('marks empty PRD as not ready', () => {
    const readiness = assessPrdSplitReadiness({ sections: [] });
    expect(readiness.isReadyForAiSplit).toBe(false);
    expect(readiness.filledSectionCount).toBe(0);
  });

  it('marks filled PRD as ready', () => {
    const readiness = assessPrdSplitReadiness({
      sections: [
        { id: 'vision', title: 'Vision', content: 'A'.repeat(100) },
        { id: 'features', title: 'Features', content: 'B'.repeat(100) },
      ],
    });
    expect(readiness.isReadyForAiSplit).toBe(true);
    expect(readiness.filledSectionCount).toBe(2);
  });
});

describe('buildTemplateClustersFromPrd', () => {
  it('creates one editable cluster per filled section', () => {
    const clusters = buildTemplateClustersFromPrd({
      sections: [
        { id: 'vision', title: 'Vision', content: 'Help founders ship faster.' },
        { id: 'features', title: 'Features', content: 'Projects and PRD tooling.' },
      ],
    });

    expect(clusters).toHaveLength(2);
    expect(clusters[0]?.label).toBe('Vision');
    expect(clusters[0]?.valueLine).toContain('Help founders ship faster');
    expect(clusters[1]?.label).toBe('Features');
  });
});
