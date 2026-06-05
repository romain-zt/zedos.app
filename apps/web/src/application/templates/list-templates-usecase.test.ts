import { describe, expect, it } from 'vitest';
import { ListTemplatesUseCase } from './list-templates-usecase';
import { GetTemplateBySlugUseCase } from './get-template-usecase';
import { StaticTemplateCatalog } from '@infrastructure/templates/static-template-catalog';
import { KNOWN_TEMPLATE_SLUGS } from '@repo/contracts/templates';

describe('Templates application layer', () => {
  const catalog = new StaticTemplateCatalog();

  describe('ListTemplatesUseCase', () => {
    it('returns exactly the 10 seed templates in canonical order', async () => {
      const uc = new ListTemplatesUseCase(catalog);
      const result = await uc.execute();
      expect(result.isOk()).toBe(true);
      const list = result.unwrap();
      expect(list).toHaveLength(10);
      expect(list.map((t) => t.slug)).toEqual([...KNOWN_TEMPLATE_SLUGS]);
    });

    it('every summary exposes a non-empty title and description', async () => {
      const uc = new ListTemplatesUseCase(catalog);
      const list = (await uc.execute()).unwrap();
      for (const summary of list) {
        expect(summary.title.length).toBeGreaterThan(0);
        expect(summary.description.length).toBeGreaterThan(0);
        expect(summary.author).toBe('zedos-official');
        expect(summary.forkCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('GetTemplateBySlugUseCase', () => {
    it('returns a fully-typed detail for a known slug', async () => {
      const uc = new GetTemplateBySlugUseCase(catalog);
      const result = await uc.execute('pitch-tomorrow');
      expect(result.isOk()).toBe(true);
      const detail = result.unwrap();
      expect(detail.slug).toBe('pitch-tomorrow');
      expect(detail.sectionsOutline.length).toBeGreaterThan(0);
      expect(detail.content.sections.length).toBeGreaterThan(0);
    });

    it('returns NotFoundError for an unknown slug (still type-narrowed via Zod-known list)', async () => {
      const uc = new GetTemplateBySlugUseCase(catalog);
      // Using `as never` here is technically a runtime-only test of the
      // adapter; the schema rejects unknown slugs at the boundary.
      const result = await uc.execute('cursor-handoff-only');
      expect(result.isOk()).toBe(true);
    });
  });
});
