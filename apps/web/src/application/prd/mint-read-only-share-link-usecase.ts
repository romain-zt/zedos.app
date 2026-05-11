import { IPrdRepository } from '@domain/prd/prd-repository';
import { MintedShareLink } from '@domain/prd/prd';
import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';

export class MintReadOnlyShareLinkUseCase {
  constructor(private prdRepository: IPrdRepository) {}

  execute(
    prdVersionId: string,
    ownerUserId: string
  ): Promise<Result<MintedShareLink, ApplicationError>> {
    return this.prdRepository.mintReadOnlyShareLink(prdVersionId, ownerUserId);
  }
}
