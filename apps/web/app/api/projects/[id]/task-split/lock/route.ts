export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { LockTaskSplitBundleRequestSchema, TaskSplitBundleSchema } from '@repo/contracts/task-split';
import { LockTaskSplitBundleUseCase } from '@application/task-split';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleTaskSplitBundleRepository } from '@infrastructure/persistence/task-split-bundle-repository';
import { ApplicationError } from '@shared/errors/application-error';
import { mapTaskSplitBundleDomainToDto } from '../_lib/map-bundle-to-contract';

function toErrorResponse(e: ApplicationError) {
  return NextResponse.json({ error: e.message }, { status: e.statusCode });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = LockTaskSplitBundleRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const useCase = new LockTaskSplitBundleUseCase(
    new DrizzleProjectRepository(),
    new DrizzleTaskSplitBundleRepository()
  );
  const result = await useCase.execute(params.id, userId, parsed.data.bundleId);
  if (result.isErr()) return toErrorResponse(result.error);

  const dto = mapTaskSplitBundleDomainToDto(result.unwrap());
  const out = TaskSplitBundleSchema.safeParse(dto);
  if (!out.success) return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  return NextResponse.json(out.data);
}
