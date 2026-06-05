import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type { TemplateSlug } from '@repo/contracts/templates';
import type { TemplateDetail, TemplateSummary } from './template';

/**
 * Read-only port for the templates catalog.
 *
 * v1 is backed by a static seed in `infrastructure/templates/static-template-catalog.ts`.
 * Future iterations may swap in a DB-backed adapter without touching the
 * application or UI layers.
 */
export interface ITemplateCatalogPort {
  listAll(): Promise<Result<TemplateSummary[], ApplicationError>>;
  getBySlug(slug: TemplateSlug): Promise<Result<TemplateDetail, ApplicationError>>;
}
