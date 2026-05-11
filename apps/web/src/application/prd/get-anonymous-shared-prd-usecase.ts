import { IPrdRepository } from '@domain/prd/prd-repository';
import { AnonymousSharedPrdReadModel } from '@domain/prd/prd';
import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';

export class GetAnonymousSharedPrdUseCase {
  constructor(private prdRepository: IPrdRepository) {}

  execute(token: string): Promise<Result<AnonymousSharedPrdReadModel, ApplicationError>> {
    return this.prdRepository.findAnonymousSharedPrdByToken(token);
  }
}
