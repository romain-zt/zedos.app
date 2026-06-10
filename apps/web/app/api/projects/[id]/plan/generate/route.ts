export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { GeneratePlanResponseSchema } from '@repo/contracts/planning';
import { GenerateDeliveryPlanUseCase } from '@application/planning';
import { milestoneRepository } from '@infrastructure/persistence/milestone-repository';
import { ticketRepository } from '@infrastructure/persistence/ticket-repository';
import { agentActivityRepository } from '@infrastructure/persistence/agent-activity-repository';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'plan-generate' });

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const useCase = new GenerateDeliveryPlanUseCase(
      new DrizzleProjectRepository(),
      ticketRepository,
      milestoneRepository,
      agentActivityRepository,
    );
    const result = await useCase.execute({ projectId: params.id, userId: userResult.unwrap().id });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }

    const out = GeneratePlanResponseSchema.safeParse(result.unwrap());
    if (!out.success) {
      logger.withContext({ projectId: params.id }).error('Plan generate outbound validation failed');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    return NextResponse.json(out.data);
  } catch (error) {
    logger.withContext({ projectId: params.id }).error('Plan generate failed', error);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}
