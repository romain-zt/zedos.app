export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { DataRoomBundleRequestSchema } from '@repo/contracts/data-room';
import { BuildDataRoomBundleUseCase } from '@application/data-room/build-data-room-bundle-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzlePrdRepository } from '@infrastructure/persistence/prd-repository';
import { DrizzleAdrRepository } from '@infrastructure/persistence/adr-repository';
import { decisionGraphRepository } from '@infrastructure/persistence/decision-graph-repository';
import { DrizzleDataRoomBundleRepository } from '@infrastructure/persistence/data-room-bundle-repository';
import { DataRoomZipAssembler } from '@infrastructure/data-room/data-room-zip-assembler';
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events';
import { captureServer } from '@infrastructure/analytics/posthog-server';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'data-room/bundle' });

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  let raw: unknown = {};
  try {
    const text = await request.text();
    if (text.trim().length > 0) raw = JSON.parse(text) as unknown;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = DataRoomBundleRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const repo = new DrizzleDataRoomBundleRepository();
  const useCase = new BuildDataRoomBundleUseCase(
    new DrizzleProjectRepository(),
    new DrizzlePrdRepository(),
    new DrizzleAdrRepository(),
    decisionGraphRepository,
    repo,
    repo,
    repo,
    new DataRoomZipAssembler(),
  );

  const result = await useCase.execute({ projectId: params.id, userId });
  if (result.isErr()) {
    logger.warn('Data room bundle failed', {
      projectId: params.id,
      userId,
      statusCode: result.error.statusCode,
    });
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }

  const out = result.unwrap();
  captureServer(AnalyticsEvents.DATA_ROOM_ZIP_DOWNLOADED, userId, {
    project_id: params.id,
    file_count: out.bundle.fileCount,
    zip_bytes: out.zipBuffer.length,
  });

  return new NextResponse(out.zipBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${out.filename}"`,
      'Content-Length': String(out.zipBuffer.length),
    },
  });
}
