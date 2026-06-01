export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { WorkspaceScoreResponseSchema } from '@repo/contracts/project/workspace-score';
import { ReadinessScoreUseCase } from '@application/adr';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzlePrdRepository } from '@infrastructure/persistence/prd-repository';
import { DrizzleAdrRepository } from '@infrastructure/persistence/adr-repository';
import { fetchProjectReadinessScore } from '../readiness-score/readiness-score-data';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'workspace-score' });

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const projectId = params.id;
  let userId: string | undefined;

  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    userId = userResult.unwrap().id;

    const clarificationResult = await fetchProjectReadinessScore(projectId, userId);
    if (clarificationResult.ok === false) {
      return NextResponse.json(
        { error: clarificationResult.error },
        { status: clarificationResult.status }
      );
    }

    const architectureUseCase = new ReadinessScoreUseCase(
      new DrizzleProjectRepository(),
      new DrizzlePrdRepository(),
      new DrizzleAdrRepository()
    );
    const architectureResult = await architectureUseCase.execute(projectId, userId);
    if (architectureResult.isErr()) {
      return NextResponse.json({ error: architectureResult.error.message }, {
        status: architectureResult.error.statusCode ?? 500,
      });
    }

    const payload = {
      clarification: clarificationResult.data,
      architecture: architectureResult.unwrap(),
    };

    const validated = WorkspaceScoreResponseSchema.safeParse(payload);
    if (!validated.success) {
      logger
        .withContext({ projectId, userId })
        .error(
          'Workspace score outbound validation failed',
          validationFailureData(validated.error.flatten())
        );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json(validated.data);
  } catch (error: unknown) {
    logger.withContext({ projectId, userId }).error('Workspace score GET failed', error);
    return NextResponse.json({ error: 'Failed to compute workspace score' }, { status: 500 });
  }
}
