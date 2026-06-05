import { ok, err, type Result } from '@repo/result';
import { NotFoundError, ApplicationError } from '@shared/errors/application-error';
import type { ITemplateCatalogPort } from '@domain/templates/template-catalog-port';
import type { TemplateDetail, TemplateSummary } from '@domain/templates/template';
import type { TemplateSlug } from '@repo/contracts/templates';
import { SEED_TEMPLATES } from './seed-templates';

function detailToSummary(detail: TemplateDetail): TemplateSummary {
  const { slug, title, description, category, journeyHint, sector, author, forkCount } = detail;
  return { slug, title, description, category, journeyHint, sector, author, forkCount };
}

/**
 * Static, in-process catalog backed by `SEED_TEMPLATES`. Pure read-only — no
 * IO, no cache invalidation needed. Safe to share across requests.
 */
export class StaticTemplateCatalog implements ITemplateCatalogPort {
  async listAll(): Promise<Result<TemplateSummary[], ApplicationError>> {
    return ok(SEED_TEMPLATES.map(detailToSummary));
  }

  async getBySlug(slug: TemplateSlug): Promise<Result<TemplateDetail, ApplicationError>> {
    const found = SEED_TEMPLATES.find((template) => template.slug === slug);
    if (!found) {
      return err(new NotFoundError(`Template not found: ${slug}`));
    }
    return ok(found);
  }
}

export const staticTemplateCatalog: ITemplateCatalogPort = new StaticTemplateCatalog();
