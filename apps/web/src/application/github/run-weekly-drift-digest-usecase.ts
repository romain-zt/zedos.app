import type { IDriftSignalRepository } from '@domain/github';
import { Result, err, ok } from '@repo/result';
import {
  ApplicationError,
  ExternalServiceError,
} from '@shared/errors/application-error';

export interface WeeklyDigestConfig {
  /** When false, the use case refuses to run (default for v1). */
  readonly enabled: boolean;
  /** Shared secret expected in the X-Cron-Secret header. */
  readonly cronSecret: string | null;
  /** Provided value from the request header. */
  readonly providedSecret: string | null;
}

export interface WeeklyDigestSummary {
  readonly enabled: boolean;
  readonly digestsSent: number;
  readonly skipped: boolean;
  readonly reason: string;
}

/**
 * v1 minimal weekly digest stub.
 *
 * Hard-gated by env: returns 503 unless DRIFT_WEEKLY_DIGEST_ENABLED === "true"
 * and the request carries the shared secret. The actual email send is deferred
 * to a follow-up slice — this stub only proves the gate + lookup wiring.
 */
export class RunWeeklyDriftDigestUseCase {
  constructor(private readonly driftSignalRepository: IDriftSignalRepository) {}

  async execute(
    config: WeeklyDigestConfig,
  ): Promise<Result<WeeklyDigestSummary, ApplicationError>> {
    if (!config.enabled) {
      return err(
        new ExternalServiceError(
          'drift-digest',
          'Weekly drift digest is disabled (DRIFT_WEEKLY_DIGEST_ENABLED=false)',
          503,
        ),
      );
    }
    if (!config.cronSecret) {
      return err(
        new ExternalServiceError(
          'drift-digest',
          'CRON_SHARED_SECRET is not configured',
          503,
        ),
      );
    }
    if (config.providedSecret !== config.cronSecret) {
      return err(
        new ExternalServiceError('drift-digest', 'Invalid cron secret', 401),
      );
    }

    // v1 stub: the actual cross-project scan + email send is deferred. We return
    // a no-op summary to prove the gate works end-to-end. Future iteration:
    // iterate active projects, fetch open signals, render and send digest.
    void this.driftSignalRepository;
    return ok({
      enabled: true,
      digestsSent: 0,
      skipped: true,
      reason: 'v1 stub: digest body not implemented',
    });
  }
}
