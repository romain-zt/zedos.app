import type { Result } from '@repo/result';
import { ok } from '@repo/result';
import { forwardErr } from '@shared/result/propagate';
import type { ApplicationError } from '@shared/errors/application-error';
import type { ITemplateCatalogPort } from '@domain/templates/template-catalog-port';
import type { TemplateSummaryDTO } from '@repo/contracts/templates';
import { toTemplateSummaryDTO } from './template-dto';

export class ListTemplatesUseCase {
  constructor(private readonly catalog: ITemplateCatalogPort) {}

  async execute(): Promise<Result<TemplateSummaryDTO[], ApplicationError>> {
    const result = await this.catalog.listAll();
    if (result.isErr()) {
      return forwardErr(result);
    }
    return ok(result.unwrap().map(toTemplateSummaryDTO));
  }
}
