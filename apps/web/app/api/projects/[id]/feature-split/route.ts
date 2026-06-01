export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleFeatureSplitRepository } from '@infrastructure/persistence/feature-split-repository';
import { GetFeatureSplitUseCase } from '@application/feature-split/get-feature-split-usecase';
import { SaveFeatureSplitDraftUseCase } from '@application/feature-split/save-feature-split-draft-usecase';
import type { NewFeatureClusterInput } from '@domain/feature-split/feature-split';
import {
  GetFeatureSplitsQuerySchema,
  FeatureSplitListResponseSchema,
  FeatureSplitDTOSchema,
  SaveFeatureSplitDraftRequestSchema,
} from '@repo/contracts/feature-split/feature-split';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'feature-split' });

function toErrorResponse(
  e: ApplicationError,
  context: { projectId: string; userId: string },
  message: string
) {
  logger.warn(message, { ...context, statusCode: e.statusCode });
  return NextResponse.json({ error: e.message }, { status: e.statusCode });
}

function mapDomainToDTO(split: {
  id: string;
  projectId: string;
  sourcePrdVersionId: string;
  status: string;
  clusters: {
    id: string;
    sortOrder: number;
    label: string;
    valueLine: string;
    boundaryCue: string;
    featureSplitId?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
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
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  const query = GetFeatureSplitsQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  );
  if (!query.success) {
    logger.warn('Feature-split GET validation failed', validationFailureData(query.error.flatten()));
    return NextResponse.json({ error: 'Invalid query', details: query.error.flatten() }, { status: 400 });
  }

  const routeContext = { projectId: params.id, userId };
  const useCase = new GetFeatureSplitUseCase(
    new DrizzleProjectRepository(),
    new DrizzleFeatureSplitRepository()
  );
  const result = await useCase.execute(params.id, userId, query.data.sourcePrdVersionId);
  if (result.isErr()) return toErrorResponse(result.error, routeContext, 'Feature-split GET failed');

  const splits = result.unwrap().map(mapDomainToDTO);
  const out = FeatureSplitListResponseSchema.safeParse(splits);
  if (!out.success) {
    logger
      .withContext(routeContext)
      .error('Feature-split GET outbound validation failed', validationFailureData(out.error.flatten()));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  return NextResponse.json(out.data);
}

export async function PUT(
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

  const parsed = SaveFeatureSplitDraftRequestSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn('Feature-split PUT validation failed', validationFailureData(parsed.error.flatten()));
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const routeContext = { projectId: params.id, userId };
  const useCase = new SaveFeatureSplitDraftUseCase(
    new DrizzleProjectRepository(),
    new DrizzleFeatureSplitRepository()
  );
  const result = await useCase.execute({
    projectId: params.id,
    userId,
    sourcePrdVersionId: parsed.data.sourcePrdVersionId,
    clusters: parsed.data.clusters as NewFeatureClusterInput[],
  });
  if (result.isErr()) return toErrorResponse(result.error, routeContext, 'Feature-split PUT failed');

  const out = FeatureSplitDTOSchema.safeParse(mapDomainToDTO(result.unwrap()));
  if (!out.success) {
    logger
      .withContext(routeContext)
      .error('Feature-split PUT outbound validation failed', validationFailureData(out.error.flatten()));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  logger.info('Feature-split draft saved', routeContext);
  return NextResponse.json(out.data);
}
