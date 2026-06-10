export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { AgentActivityListResponseSchema } from '@repo/contracts/team';
import { ListAgentActivitiesUseCase } from '@application/team';
import { agentActivityRepository } from '@infrastructure/persistence/agent-activity-repository';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleProjectMemberRepository } from '@infrastructure/persistence/project-member-repository';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'agent-activities-list' });

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const useCase = new ListAgentActivitiesUseCase(
      agentActivityRepository,
      new DrizzleProjectRepository(),
      new DrizzleProjectMemberRepository(),
    );
    const result = await useCase.execute({ projectId: params.id, userId: userResult.unwrap().id });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }

    const validated = AgentActivityListResponseSchema.safeParse({ activities: result.unwrap() });
    if (!validated.success) {
      logger.withContext({ projectId: params.id }).error('Activities outbound validation failed');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    return NextResponse.json(validated.data);
  } catch (error) {
    logger.withContext({ projectId: params.id }).error('Activities GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}
