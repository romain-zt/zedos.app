export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  ListDriftSignalsResponseSchema,
  DriftSignalStatusSchema,
  type DriftSignalDTO,
} from '@repo/contracts/github/drift';
import { ListDriftSignalsUseCase } from '@application/github/list-drift-signals-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { driftSignalRepository } from '@infrastructure/persistence/drift-signal-repository';
import type { DriftSignal } from '@domain/github';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'drift-signals-list' });

function toDto(signal: DriftSignal): DriftSignalDTO {
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const statusParam = request.nextUrl.searchParams.get('status');
    const statusFilter = statusParam ? DriftSignalStatusSchema.safeParse(statusParam) : null;
    const useCase = new ListDriftSignalsUseCase(
      new DrizzleProjectRepository(),
      driftSignalRepository,
    );
    const result = await useCase.execute(
      projectId,
      userResult.unwrap().id,
      statusFilter && statusFilter.success ? statusFilter.data : undefined,
    );
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    const payload = { signals: result.unwrap().map(toDto) };
    const validated = ListDriftSignalsResponseSchema.safeParse(payload);
    if (!validated.success) {
      logger
        .withContext({ projectId })
        .error('Drift signals outbound validation failed', validationFailureData(validated.error.flatten()));
      return NextResponse.json({ error: 'Internal validation error' }, { status: 500 });
    }
    return NextResponse.json(validated.data);
  } catch (error) {
    logger.withContext({ projectId }).error('Drift signals GET failed', error);
    return NextResponse.json({ error: 'Failed to list drift signals' }, { status: 500 });
  }
}
