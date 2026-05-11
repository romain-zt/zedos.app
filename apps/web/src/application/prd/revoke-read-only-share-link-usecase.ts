import { IPrdRepository } from '@domain/prd/prd-repository';
import { MintedShareLink } from '@domain/prd/prd';
import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';

export class RevokeReadOnlyShareLinkUseCase {
  constructor(private prdRepository: IPrdRepository) {}

  execute(
    shareLinkId: string,
    ownerUserId: string
  ): Promise<Result<MintedShareLink, ApplicationError>> {
    return this.prdRepository.revokeReadOnlyShareLink(shareLinkId, ownerUserId);
  }
}
