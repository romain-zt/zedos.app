import { describe, it, expect } from 'vitest';
import { applySectionPatch } from './update-prd-content-usecase';

const prd = {
  title: 'My product',
  version_summary: 'v1',
  sections: [
    {
      id: 'vision',
      title: 'Vision',
      content: 'Original vision',
      confidence: 'high',
      open_questions: [],
    },
    {
      id: 'users',
      title: 'Users',
      content: 'Original users',
      confidence: 'medium',
      open_questions: ['Who pays?'],
    },
  ],
};

describe('applySectionPatch', () => {
  it('replaces only the targeted section content', () => {
    const result = applySectionPatch(prd, { sectionId: 'users', content: 'Edited by human' });
    expect(result.isOk()).toBe(true);
    const next = result.unwrap();
    expect(next.sections?.[1]?.content).toBe('Edited by human');
    expect(next.sections?.[0]?.content).toBe('Original vision');
    // metadata of the edited section is preserved
    expect(next.sections?.[1]?.open_questions).toEqual(['Who pays?']);
  });

  it('optionally renames the section title', () => {
    const result = applySectionPatch(prd, {
      sectionId: 'vision',
      content: 'New vision',
      title: 'Product vision',
    });
    expect(result.isOk()).toBe(true);
    expect(result.unwrap().sections?.[0]?.title).toBe('Product vision');
  });

  it('fails with 404-style error for an unknown section', () => {
    const result = applySectionPatch(prd, { sectionId: 'nope', content: 'x' });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.statusCode).toBe(404);
  });

  it('rejects unstructured PRD bodies (intake / legacy)', () => {
    const result = applySectionPatch({ idea: 'just a string map' }, {
      sectionId: 'vision',
      content: 'x',
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.statusCode).toBe(400);
  });

  it('does not mutate the original content', () => {
    const before = JSON.stringify(prd);
    applySectionPatch(prd, { sectionId: 'users', content: 'mutation check' });
    expect(JSON.stringify(prd)).toBe(before);
  });
});
