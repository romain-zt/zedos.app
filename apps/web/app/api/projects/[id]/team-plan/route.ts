export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { TeamPlanDTOSchema } from '@repo/contracts/team';
import { GetTeamPlanUseCase, GenerateTeamPlanUseCase } from '@application/team';
import {
  agentActivityRepository,
  teamPlanRepository,
} from '@infrastructure/persistence/agent-activity-repository';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleProjectMemberRepository } from '@infrastructure/persistence/project-member-repository';
import { DrizzlePrdRepository } from '@infrastructure/persistence/prd-repository';
import { DrizzleFeatureSplitRepository } from '@infrastructure/persistence/feature-split-repository';
import { teamPlanGenerator } from '@infrastructure/ai/team-plan-generator-adapter';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'team-plan' });

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const useCase = new GetTeamPlanUseCase(
      teamPlanRepository,
      new DrizzleProjectRepository(),
      new DrizzleProjectMemberRepository(),
    );
    const result = await useCase.execute({ projectId: params.id, userId: userResult.unwrap().id });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    const plan = result.unwrap();
    return NextResponse.json({ teamPlan: plan ? TeamPlanDTOSchema.parse(plan) : null });
  } catch (error) {
    logger.withContext({ projectId: params.id }).error('Team plan GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch team plan' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const useCase = new GenerateTeamPlanUseCase(
      new DrizzleProjectRepository(),
      new DrizzlePrdRepository(),
      new DrizzleFeatureSplitRepository(),
      teamPlanRepository,
      teamPlanGenerator,
      agentActivityRepository,
    );
    const result = await useCase.execute({ projectId: params.id, userId: userResult.unwrap().id });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    return NextResponse.json({ teamPlan: TeamPlanDTOSchema.parse(result.unwrap()) });
  } catch (error) {
    logger.withContext({ projectId: params.id }).error('Team plan POST failed', error);
    return NextResponse.json({ error: 'Failed to generate team plan' }, { status: 500 });
  }
}
