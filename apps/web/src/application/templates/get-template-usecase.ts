import type { Result } from '@repo/result';
import { ok } from '@repo/result';
import { forwardErr } from '@shared/result/propagate';
import type { ApplicationError } from '@shared/errors/application-error';
import type { ITemplateCatalogPort } from '@domain/templates/template-catalog-port';
import type {
  TemplateDetailDTO,
  TemplateSlug,
} from '@repo/contracts/templates';
import { toTemplateDetailDTO } from './template-dto';

export class GetTemplateBySlugUseCase {
  constructor(private readonly catalog: ITemplateCatalogPort) {}

  async execute(slug: TemplateSlug): Promise<Result<TemplateDetailDTO, ApplicationError>> {
    const result = await this.catalog.getBySlug(slug);
    if (result.isErr()) {
      return forwardErr(result);
    }
    return ok(toTemplateDetailDTO(result.unwrap()));
  }
}
