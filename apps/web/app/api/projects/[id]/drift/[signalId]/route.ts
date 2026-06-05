export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  DriftSignalDTOSchema,
  ResolveDriftSignalRequestSchema,
} from '@repo/contracts/github/drift';
import { ResolveDriftSignalUseCase } from '@application/github/resolve-drift-signal-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { driftSignalRepository } from '@infrastructure/persistence/drift-signal-repository';
import type { DriftSignal } from '@domain/github';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'drift-signal-update' });

function toDto(signal: DriftSignal) {
  return {
    id: signal.id,
    projectId: signal.projectId,
    kind: signal.kind,
    severity: signal.severity,
    summary: signal.summary,
    source: signal.source,
    status: signal.status,
    createdAt: signal.createdAt,
    resolvedAt: signal.resolvedAt,
    dismissedAt: signal.dismissedAt,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; signalId: string } },
) {
  const { id: projectId, signalId } = params;
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => null);
    const parsed = ResolveDriftSignalRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const useCase = new ResolveDriftSignalUseCase(
      new DrizzleProjectRepository(),
      driftSignalRepository,
    );
    const result = await useCase.execute(
      projectId,
      signalId,
      userResult.unwrap().id,
      parsed.data.action,
    );
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    const dto = DriftSignalDTOSchema.safeParse(toDto(result.unwrap()));
    if (!dto.success) {
      logger
        .withContext({ projectId, signalId })
        .error('Drift signal DTO validation failed', validationFailureData(dto.error.flatten()));
      return NextResponse.json({ error: 'Internal validation error' }, { status: 500 });
    }
    return NextResponse.json(dto.data);
  } catch (error) {
    logger.withContext({ projectId, signalId }).error('Drift signal PATCH failed', error);
    return NextResponse.json({ error: 'Failed to update drift signal' }, { status: 500 });
  }
}
