export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleFeatureSplitRepository } from '@infrastructure/persistence/feature-split-repository';
import { GetFeatureSplitUseCase } from '@application/feature-split/get-feature-split-usecase';
import { SaveFeatureSplitDraftUseCase } from '@application/feature-split/save-feature-split-draft-usecase';
import {
  GetFeatureSplitsQuerySchema,
  FeatureSplitListResponseSchema,
  FeatureSplitDTOSchema,
  SaveFeatureSplitDraftRequestSchema,
} from '@repo/contracts/feature-split/feature-split';
import { ApplicationError } from '@shared/errors/application-error';

function toErrorResponse(e: ApplicationError) {
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
    return NextResponse.json({ error: 'Invalid query', details: query.error.flatten() }, { status: 400 });
  }

  const useCase = new GetFeatureSplitUseCase(
    new DrizzleProjectRepository(),
    new DrizzleFeatureSplitRepository()
  );
  const result = await useCase.execute(params.id, userId, query.data.sourcePrdVersionId);
  if (result.isErr()) return toErrorResponse(result.error);

  const splits = result.unwrap().map(mapDomainToDTO);
  const out = FeatureSplitListResponseSchema.safeParse(splits);
  if (!out.success) return NextResponse.json({ error: 'Internal error' }, { status: 500 });
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
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const useCase = new SaveFeatureSplitDraftUseCase(
    new DrizzleProjectRepository(),
    new DrizzleFeatureSplitRepository()
  );
  const result = await useCase.execute({
    projectId: params.id,
    userId,
    sourcePrdVersionId: parsed.data.sourcePrdVersionId,
    clusters: parsed.data.clusters,
  });
  if (result.isErr()) return toErrorResponse(result.error);

  const out = FeatureSplitDTOSchema.safeParse(mapDomainToDTO(result.unwrap()));
  if (!out.success) return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  return NextResponse.json(out.data);
}
