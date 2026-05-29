export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  DeliveryPreviewRequestSchema,
  DeliveryPreviewResponseSchema,
} from '@repo/contracts/delivery';
import { PreviewDeliveryPackageUseCase } from '@application/delivery/preview-delivery-package-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleDeliveryExportRepository } from '@infrastructure/delivery/delivery-export-repository';
import { ApplicationError } from '@shared/errors/application-error';

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

  const parsed = DeliveryPreviewRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const useCase = new PreviewDeliveryPackageUseCase(
    new DrizzleProjectRepository(),
    new DrizzleDeliveryExportRepository()
  );
  const result = await useCase.execute(params.id, userId, parsed.data.bundleIds);
  if (result.isErr()) return toErrorResponse(result.error);

  const out = DeliveryPreviewResponseSchema.safeParse(result.unwrap());
  if (!out.success) return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  return NextResponse.json(out.data);
}
