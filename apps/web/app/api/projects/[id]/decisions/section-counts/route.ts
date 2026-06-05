export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { SectionDecisionCountsResponseSchema } from '@repo/contracts/decisions/decision';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { decisionGraphRepository } from '@infrastructure/persistence/decision-graph-repository';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'decisions-section-counts' });

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const projectId = params.id;
  let userId: string | undefined;

  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = userResult.unwrap().id;

    const projectRepo = new DrizzleProjectRepository();
    const projectResult = await projectRepo.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      const error = projectResult.error;
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const countsResult = await decisionGraphRepository.countBySectionForProject(projectId);
    if (countsResult.isErr()) {
      const error = countsResult.error;
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const validated = SectionDecisionCountsResponseSchema.safeParse(countsResult.unwrap());
    if (!validated.success) {
      logger
        .withContext({ projectId, userId })
        .error(
          'Section counts outbound validation failed',
          validationFailureData(validated.error.flatten()),
        );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json(validated.data);
  } catch (error) {
    logger.withContext({ projectId, userId }).error('Section counts GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch section counts' }, { status: 500 });
  }
}
