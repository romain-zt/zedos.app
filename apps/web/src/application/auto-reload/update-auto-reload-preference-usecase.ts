import type { IAutoReloadRepository } from '@domain/auto-reload/auto-reload-repository';
import {
  autoReloadPreferenceHasSavedMethod,
  type AutoReloadPackSize,
} from '@domain/auto-reload/auto-reload-preference';
import type { AutoReloadPreferenceDTO } from '@repo/contracts/payments';
import { Result, ok, err } from '@repo/result';
import { ValidationError, type ApplicationError } from '@shared/errors/application-error';
import { forwardErr } from '@shared/result/propagate';

export class UpdateAutoReloadPreferenceUseCase {
  constructor(private readonly autoReloadRepository: IAutoReloadRepository) {}

  async execute(
    userId: string,
    input: { enabled: boolean; packSize?: AutoReloadPackSize }
  ): Promise<Result<AutoReloadPreferenceDTO, ApplicationError>> {
    if (input.enabled) {
      const currentResult = await this.autoReloadRepository.getByUserId(userId);
      if (currentResult.isErr()) {
        return forwardErr(currentResult);
      }
      if (!autoReloadPreferenceHasSavedMethod(currentResult.unwrap())) {
        return err(
          new ValidationError(
            'Auto-reload requires a saved payment method from a prior successful checkout'
          )
        );
      }
    }

    const updated = await this.autoReloadRepository.upsertPreference(userId, input);
    if (updated.isErr()) {
      return forwardErr(updated);
    }
    const pref = updated.unwrap();
    return ok({
      enabled: pref.enabled,
      packSize: pref.packSize,
      thresholdCredits: pref.thresholdCredits,
      hasSavedPaymentMethod: autoReloadPreferenceHasSavedMethod(pref),
    });
  }
}
