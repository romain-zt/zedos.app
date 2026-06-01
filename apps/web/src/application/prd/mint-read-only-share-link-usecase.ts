import { IPrdRepository } from '@domain/prd/prd-repository';
import { MintShareLinkOptions, MintedShareLink } from '@domain/prd/prd';
import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';

export class MintReadOnlyShareLinkUseCase {
  constructor(private prdRepository: IPrdRepository) {}

  execute(
    prdVersionId: string,
    ownerUserId: string,
    options?: MintShareLinkOptions
  ): Promise<Result<MintedShareLink, ApplicationError>> {
    return this.prdRepository.mintReadOnlyShareLink(prdVersionId, ownerUserId, options);
  }
}
