export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { MilestoneDTOSchema, UpdateMilestoneRequestSchema } from '@repo/contracts/planning';
import { UpdateMilestoneUseCase, DeleteMilestoneUseCase } from '@application/planning';
import { milestoneDeps } from '../_lib/deps';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'milestone-detail' });

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; milestoneId: string } },
) {
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = UpdateMilestoneRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await new UpdateMilestoneUseCase(milestoneDeps()).execute({
      projectId: params.id,
      milestoneId: params.milestoneId,
      userId: userResult.unwrap().id,
      patch: parsed.data,
    });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    return NextResponse.json({ milestone: MilestoneDTOSchema.parse(result.unwrap()) });
  } catch (error) {
    logger.withContext({ projectId: params.id }).error('Milestone PATCH failed', error);
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; milestoneId: string } },
) {
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await new DeleteMilestoneUseCase(milestoneDeps()).execute({
      projectId: params.id,
      milestoneId: params.milestoneId,
      userId: userResult.unwrap().id,
    });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.withContext({ projectId: params.id }).error('Milestone DELETE failed', error);
    return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
  }
}
