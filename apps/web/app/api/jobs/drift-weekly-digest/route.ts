export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { RunWeeklyDriftDigestUseCase } from '@application/github/run-weekly-drift-digest-usecase';
import { driftSignalRepository } from '@infrastructure/persistence/drift-signal-repository';
import { readWeeklyDigestEnv } from '@infrastructure/github/github-config';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'drift-weekly-digest' });

const CRON_HEADER = 'x-cron-secret';

export async function POST(request: NextRequest) {
  try {
    const env = readWeeklyDigestEnv();
    const useCase = new RunWeeklyDriftDigestUseCase(driftSignalRepository);
    const result = await useCase.execute({
      enabled: env.enabled,
      cronSecret: env.cronSecret,
      providedSecret: request.headers.get(CRON_HEADER),
    });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    return NextResponse.json(result.unwrap());
  } catch (error) {
    logger.error('Drift weekly digest job failed', error);
    return NextResponse.json({ error: 'Drift digest job failed' }, { status: 500 });
  }
}
