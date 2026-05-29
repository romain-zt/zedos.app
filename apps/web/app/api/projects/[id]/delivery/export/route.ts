export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { DeliveryExportRequestSchema } from '@repo/contracts/delivery';
import { BuildDeliveryPackageUseCase } from '@application/delivery/build-delivery-package-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleDeliveryExportRepository } from '@infrastructure/delivery/delivery-export-repository';
import { CursorPackageAssembler } from '@infrastructure/delivery/cursor-package-assembler';
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

  const parsed = DeliveryExportRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const useCase = new BuildDeliveryPackageUseCase(
    new DrizzleProjectRepository(),
    new DrizzleDeliveryExportRepository(),
    new CursorPackageAssembler()
  );
  const result = await useCase.execute(params.id, userId, parsed.data.bundleIds);
  if (result.isErr()) return toErrorResponse(result.error);

  const build = result.unwrap();
  return new NextResponse(build.zipBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${build.filename}"`,
      'Content-Length': String(build.zipBuffer.length),
    },
  });
}
