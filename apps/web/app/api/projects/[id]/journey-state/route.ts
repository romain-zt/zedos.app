export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { JourneyStateDTOSchema } from '@repo/contracts/project';
import { GetJourneyStateUseCase } from '@application/project/get-journey-state-usecase';
import { journeyStateReader } from '@infrastructure/persistence/journey-state-reader';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleProjectMemberRepository } from '@infrastructure/persistence/project-member-repository';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'journey-state' });

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const useCase = new GetJourneyStateUseCase(
      journeyStateReader,
      new DrizzleProjectRepository(),
      new DrizzleProjectMemberRepository(),
    );
    const result = await useCase.execute({ projectId: params.id, userId: userResult.unwrap().id });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    const out = JourneyStateDTOSchema.safeParse(result.unwrap());
    if (!out.success) {
      logger.withContext({ projectId: params.id }).error('Journey state outbound validation failed');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    return NextResponse.json(out.data);
  } catch (error) {
    logger.withContext({ projectId: params.id }).error('Journey state GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch journey state' }, { status: 500 });
  }
}
