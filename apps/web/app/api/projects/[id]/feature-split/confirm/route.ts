export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleFeatureSplitRepository } from '@infrastructure/persistence/feature-split-repository';
import { ConfirmFeatureSplitUseCase } from '@application/feature-split/confirm-feature-split-usecase';
import {
  ConfirmFeatureSplitRequestSchema,
  FeatureSplitDTOSchema,
} from '@repo/contracts/feature-split/feature-split';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'feature-split/confirm' });

function toErrorResponse(
  e: ApplicationError,
  context: { projectId: string; userId: string },
  message: string
) {
  logger.warn(message, { ...context, statusCode: e.statusCode });
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

  const parsed = ConfirmFeatureSplitRequestSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn('Feature-split confirm validation failed', validationFailureData(parsed.error.flatten()));
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const routeContext = { projectId: params.id, userId };
  const useCase = new ConfirmFeatureSplitUseCase(
    new DrizzleProjectRepository(),
    new DrizzleFeatureSplitRepository()
  );
  const result = await useCase.execute(parsed.data.featureSplitId, params.id, userId);
  if (result.isErr()) return toErrorResponse(result.error, routeContext, 'Feature-split confirm failed');

  const split = result.unwrap();
  const dto = {
    id: split.id,
    projectId: split.projectId,
    sourcePrdVersionId: split.sourcePrdVersionId,
    status: split.status,
    clusters: split.clusters.map((c) => ({
      id: c.id,
      sortOrder: c.sortOrder,
      label: c.label,
      valueLine: c.valueLine,
      boundaryCue: c.boundaryCue,
    })),
    createdAt: split.createdAt,
    updatedAt: split.updatedAt,
  };

  const out = FeatureSplitDTOSchema.safeParse(dto);
  if (!out.success) {
    logger
      .withContext(routeContext)
      .error('Feature-split confirm outbound validation failed', validationFailureData(out.error.flatten()));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  logger.info('Feature-split confirmed', { ...routeContext, featureSplitId: parsed.data.featureSplitId });
  return NextResponse.json(out.data);
}
