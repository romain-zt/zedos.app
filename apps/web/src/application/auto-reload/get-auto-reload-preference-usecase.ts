import type { IAutoReloadRepository } from '@domain/auto-reload/auto-reload-repository';
import { autoReloadPreferenceHasSavedMethod } from '@domain/auto-reload/auto-reload-preference';
import type { AutoReloadPreferenceDTO } from '@repo/contracts/payments';
import { Result, ok } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import { forwardErr } from '@shared/result/propagate';

export class GetAutoReloadPreferenceUseCase {
  constructor(private readonly autoReloadRepository: IAutoReloadRepository) {}

  async execute(userId: string): Promise<Result<AutoReloadPreferenceDTO, ApplicationError>> {
    const prefResult = await this.autoReloadRepository.getByUserId(userId);
    if (prefResult.isErr()) {
      return forwardErr(prefResult);
    }
    const pref = prefResult.unwrap();
    return ok({
      enabled: pref.enabled,
      packSize: pref.packSize,
      thresholdCredits: pref.thresholdCredits,
      hasSavedPaymentMethod: autoReloadPreferenceHasSavedMethod(pref),
    });
  }
}
