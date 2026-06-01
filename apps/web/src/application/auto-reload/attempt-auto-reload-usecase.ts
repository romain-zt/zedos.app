import type { IAutoReloadRepository } from '@domain/auto-reload/auto-reload-repository';
import { autoReloadPreferenceHasSavedMethod } from '@domain/auto-reload/auto-reload-preference';
import type { AutoReloadAttemptOutcome } from '@repo/contracts/payments';
import { attemptOffSessionAutoReload } from '@infrastructure/payments/stripe-off-session-auto-reload';

export type AttemptAutoReloadResult = {
  outcome: AutoReloadAttemptOutcome;
  creditsAdded?: number;
  newBalance?: number;
};

/**
 * OQ-1 (product): attempt when balance is below the operation cost and auto-reload is enabled.
 * Called from the credits HTTP bridge before returning "insufficient credits".
 */
export class AttemptAutoReloadUseCase {
  constructor(private readonly autoReloadRepository: IAutoReloadRepository) {}

  async execute(userId: string, _operationCost: number): Promise<AttemptAutoReloadResult> {
    const prefResult = await this.autoReloadRepository.getByUserId(userId);
    if (prefResult.isErr()) {
      return { outcome: 'skipped' };
    }
    const pref = prefResult.unwrap();

    if (!pref.enabled || !autoReloadPreferenceHasSavedMethod(pref)) {
      return { outcome: 'not_configured' };
    }

    const stripeCustomerId = pref.stripeCustomerId;
    const stripePaymentMethodId = pref.stripePaymentMethodId;
    if (stripeCustomerId == null || stripePaymentMethodId == null) {
      return { outcome: 'not_configured' };
    }

    const attempt = await attemptOffSessionAutoReload({
      userId,
      packSize: pref.packSize,
      stripeCustomerId,
      stripePaymentMethodId,
    });

    if (attempt.outcome === 'succeeded') {
      return {
        outcome: 'succeeded',
        creditsAdded: attempt.creditsAdded,
        newBalance: attempt.newBalance,
      };
    }

    return { outcome: attempt.outcome };
  }
}
