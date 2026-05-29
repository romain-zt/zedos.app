export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { ExportEligibleListResponseSchema } from '@repo/contracts/delivery';
import { ListExportEligibleBundlesUseCase } from '@application/delivery/list-export-eligible-bundles-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleDeliveryExportRepository } from '@infrastructure/delivery/delivery-export-repository';
import { ApplicationError } from '@shared/errors/application-error';

function toErrorResponse(e: ApplicationError) {
  return NextResponse.json({ error: e.message }, { status: e.statusCode });
}

function mapEligibleToDto(bundles: {
  id: string;
  storyTitle: string;
  taskCount: number;
  lockedAt: Date;
}[]) {
  return {
    bundles: bundles.map((b) => ({
      id: b.id,
      storyTitle: b.storyTitle,
      taskCount: b.taskCount,
      lockedAt: b.lockedAt,
    })),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  const useCase = new ListExportEligibleBundlesUseCase(
    new DrizzleProjectRepository(),
    new DrizzleDeliveryExportRepository()
  );
  const result = await useCase.execute(params.id, userId);
  if (result.isErr()) return toErrorResponse(result.error);

  const dto = mapEligibleToDto(result.unwrap());
  const parsed = ExportEligibleListResponseSchema.safeParse(dto);
  if (!parsed.success) return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  return NextResponse.json(parsed.data);
}
