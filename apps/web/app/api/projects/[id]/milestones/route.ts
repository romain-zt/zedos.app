export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  CreateMilestoneRequestSchema,
  MilestoneDTOSchema,
  MilestoneListResponseSchema,
} from '@repo/contracts/planning';
import { ListMilestonesUseCase, CreateMilestoneUseCase } from '@application/planning';
import { milestoneDeps } from './_lib/deps';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'milestones' });

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await new ListMilestonesUseCase(milestoneDeps()).execute({
      projectId: params.id,
      userId: userResult.unwrap().id,
    });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    const out = MilestoneListResponseSchema.safeParse({ milestones: result.unwrap() });
    if (!out.success) {
      logger.withContext({ projectId: params.id }).error('Milestones outbound validation failed');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    return NextResponse.json(out.data);
  } catch (error) {
    logger.withContext({ projectId: params.id }).error('Milestones GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = CreateMilestoneRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await new CreateMilestoneUseCase(milestoneDeps()).execute({
      projectId: params.id,
      userId: userResult.unwrap().id,
      milestone: parsed.data,
    });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    return NextResponse.json({ milestone: MilestoneDTOSchema.parse(result.unwrap()) }, { status: 201 });
  } catch (error) {
    logger.withContext({ projectId: params.id }).error('Milestones POST failed', error);
    return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
  }
}
