import type {
  WaitlistContactRequest,
  WaitlistContactResponse,
  WaitlistQualificationRequest,
  WaitlistQualificationResponse,
} from '@repo/contracts/marketing/waitlist';
import { err, ok, type Result } from '@repo/result';
import {
  type ApplicationError,
  NotFoundError,
} from '@shared/errors/application-error';

export interface WaitlistRepository {
  upsertContact(
    input: WaitlistContactRequest
  ): Promise<Result<WaitlistContactResponse, ApplicationError>>;
  qualifyLead(
    input: WaitlistQualificationRequest
  ): Promise<Result<string | null, ApplicationError>>;
}

export class SubmitWaitlistContactUseCase {
  constructor(private readonly repository: WaitlistRepository) {}

  async execute(
    input: WaitlistContactRequest
  ): Promise<Result<WaitlistContactResponse, ApplicationError>> {
    return this.repository.upsertContact(input);
  }
}

export class QualifyWaitlistLeadUseCase {
  constructor(private readonly repository: WaitlistRepository) {}

  async execute(
    input: WaitlistQualificationRequest
  ): Promise<Result<WaitlistQualificationResponse, ApplicationError>> {
    const result = await this.repository.qualifyLead(input);
    if (result.isErr()) return err(result.error);

    const leadId = result.unwrap();
    if (!leadId) return err(new NotFoundError('Waitlist application not found'));

    return ok({ leadId, status: 'qualified' });
  }
}
