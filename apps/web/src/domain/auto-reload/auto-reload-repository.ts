import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type { AutoReloadPackSize, AutoReloadPreference } from './auto-reload-preference';

export interface IAutoReloadRepository {
  getByUserId(userId: string): Promise<Result<AutoReloadPreference, ApplicationError>>;
  upsertPreference(
    userId: string,
    input: { enabled: boolean; packSize?: AutoReloadPackSize }
  ): Promise<Result<AutoReloadPreference, ApplicationError>>;
  saveStripePaymentMethod(
    userId: string,
    stripeCustomerId: string,
    stripePaymentMethodId: string
  ): Promise<Result<AutoReloadPreference, ApplicationError>>;
}
